import { StatusEvento, TipoEvento } from "../types/evento";
import { DIAS_PARA_ALERTA, DIAS_URGENTE, diasEntre } from "./prazos";

export const LIMITE_PROXIMOS_EVENTOS = 6;

export type EventoParaCalculo = {
  id: number;
  titulo: string;
  tipo: TipoEvento;
  data: string; // AAAA-MM-DD
  peso: number;
  status: StatusEvento;
  disciplina: { id: number; nome: string };
};

export type DisciplinaParaCalculo = {
  id: number;
  nome: string;
  professor: string | null;
  semestre: string | null;
  cargaHoraria: number | null;
  horario: string | null;
  eventos: EventoParaCalculo[];
};

export type EventoComPrazo = EventoParaCalculo & { diasRestantes: number };

export type ContagemEventos = {
  total: number;
  pendentes: number; 
  emAndamento: number;
  concluidos: number; 
  abertos: number; 
  atrasados: number;
};

export type Alerta = {
  tipo: "PRAZO_PROXIMO" | "PRAZO_VENCIDO";
  nivel: "alto" | "medio";
  evento: EventoComPrazo;
};

export function estaAberto(evento: Pick<EventoParaCalculo, "status">) {
  return evento.status !== "CONCLUIDO";
}

function porDataEId(a: EventoParaCalculo, b: EventoParaCalculo) {
  return a.data.localeCompare(b.data) || a.id - b.id;
}

function comPrazo(evento: EventoParaCalculo, hoje: string): EventoComPrazo {
  return { ...evento, diasRestantes: diasEntre(hoje, evento.data) };
}

export function contarEventos(eventos: EventoParaCalculo[], hoje: string): ContagemEventos {
  const contagem: ContagemEventos = {
    total: eventos.length,
    pendentes: 0,
    emAndamento: 0,
    concluidos: 0,
    abertos: 0,
    atrasados: 0,
  };

  for (const evento of eventos) {
    if (evento.status === "PENDENTE") contagem.pendentes++;
    if (evento.status === "EM_ANDAMENTO") contagem.emAndamento++;
    if (evento.status === "CONCLUIDO") contagem.concluidos++;

    if (estaAberto(evento)) {
      contagem.abertos++;
      if (evento.data < hoje) contagem.atrasados++;
    }
  }

  return contagem;
}
export function proximosEventos(
  eventos: EventoParaCalculo[],
  hoje: string,
  limite = LIMITE_PROXIMOS_EVENTOS
) {
  return eventos
    .filter((evento) => estaAberto(evento) && evento.data >= hoje)
    .sort(porDataEId)
    .slice(0, limite)
    .map((evento) => comPrazo(evento, hoje));
}

export function gerarAlertasDePrazo(eventos: EventoParaCalculo[], hoje: string): Alerta[] {
  const abertos = eventos.filter(estaAberto).sort(porDataEId).map((e) => comPrazo(e, hoje));

  const proximos: Alerta[] = abertos
    .filter((evento) => evento.diasRestantes >= 0 && evento.diasRestantes <= DIAS_PARA_ALERTA)
    .map((evento) => ({
      tipo: "PRAZO_PROXIMO",
      nivel: evento.diasRestantes <= DIAS_URGENTE ? "alto" : "medio",
      evento,
    }));

  const vencidos: Alerta[] = abertos
    .filter((evento) => evento.diasRestantes < 0)
    .reverse()
    .map((evento) => ({ tipo: "PRAZO_VENCIDO", nivel: "medio", evento }));

  return [...proximos, ...vencidos];
}

export function montarPainel(disciplinas: DisciplinaParaCalculo[], hoje: string) {
  const eventos = disciplinas.flatMap((disciplina) => disciplina.eventos);
  const alertas = gerarAlertasDePrazo(eventos, hoje);

  const semestres = [
    ...new Set(disciplinas.map((d) => d.semestre).filter((s): s is string => Boolean(s))),
  ]
    .sort()
    .reverse();

  return {
    hoje,
    semestres,
    regras: { diasParaAlerta: DIAS_PARA_ALERTA, diasUrgente: DIAS_URGENTE },
    resumo: {
      disciplinas: disciplinas.length,
      eventos: contarEventos(eventos, hoje),
      prazosProximos: alertas.filter((alerta) => alerta.tipo === "PRAZO_PROXIMO").length,
    },
    proximosEventos: proximosEventos(eventos, hoje),
    alertas,
    disciplinas: disciplinas.map((disciplina) => ({
      id: disciplina.id,
      nome: disciplina.nome,
      professor: disciplina.professor,
      semestre: disciplina.semestre,
      cargaHoraria: disciplina.cargaHoraria,
      horario: disciplina.horario,
      eventos: contarEventos(disciplina.eventos, hoje),
      proximoEvento: proximosEventos(disciplina.eventos, hoje, 1)[0] ?? null,
    })),
  };
}
