// Indicadores do Dashboard calculados a partir das disciplinas e dos eventos
// do calendário. Funções puras: recebem os dados já lidos do banco.
import { StatusEvento, TipoEvento } from "../types/evento";
import { DIAS_PARA_ALERTA, DIAS_URGENTE, diasEntre } from "./prazos";
import { Desempenho, RegraMedia, calcularDesempenho, ehAvaliativo } from "./notas";
import { Frequencia, RegistroParaCalculo, calcularFrequencia } from "./frequencia";
import { arredondar } from "./numeros";

export const LIMITE_PROXIMOS_EVENTOS = 6;

export type EventoParaCalculo = {
  id: number;
  titulo: string;
  tipo: TipoEvento;
  data: string; // AAAA-MM-DD
  peso: number;
  status: StatusEvento;
  nota: number | null;
  notaMaxima: number;
  disciplina: { id: number; nome: string };
};

export type DisciplinaParaCalculo = {
  id: number;
  nome: string;
  professor: string | null;
  semestre: string | null;
  cargaHoraria: number | null;
  horario: string | null;
  regraMedia: RegraMedia;
  mediaAprovacao: number | null;
  limiteFaltas: number;
  eventos: EventoParaCalculo[];
  frequencias: RegistroParaCalculo[];
};

export type EventoComPrazo = EventoParaCalculo & { diasRestantes: number };

export type ContagemEventos = {
  total: number;
  pendentes: number; // status PENDENTE
  emAndamento: number; // status EM_ANDAMENTO
  concluidos: number; // status CONCLUIDO
  abertos: number; // pendentes + em andamento
  atrasados: number; // abertos com data anterior a hoje
};

export type TipoAlerta =
  | "PRAZO_PROXIMO"
  | "PRAZO_VENCIDO"
  | "FREQUENCIA_ACIMA_DO_LIMITE"
  | "FREQUENCIA_PERTO_DO_LIMITE"
  | "MEDIA_INALCANCAVEL"
  | "MEDIA_ABAIXO"
  | "NOTA_AGUARDANDO";

export type Alerta = {
  tipo: TipoAlerta;
  nivel: "alto" | "medio";
  disciplina: { id: number; nome: string };
  evento?: EventoComPrazo;
  // Números usados na mensagem (média, faltas etc.), conforme o tipo do alerta.
  valores?: Record<string, number | null>;
};

// Alertas sobre o desempenho da disciplina (contam em "disciplinas em atenção").
const ALERTAS_ACADEMICOS: TipoAlerta[] = [
  "FREQUENCIA_ACIMA_DO_LIMITE",
  "FREQUENCIA_PERTO_DO_LIMITE",
  "MEDIA_INALCANCAVEL",
  "MEDIA_ABAIXO",
];

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

/** Eventos não concluídos de hoje em diante, do mais próximo para o mais distante. */
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

/**
 * PRAZO_PROXIMO: evento não concluído que vence em até DIAS_PARA_ALERTA dias;
 * nível alto quando faltam até DIAS_URGENTE dias.
 * PRAZO_VENCIDO: evento cuja data já passou e que ainda não foi marcado como concluído.
 */
export function gerarAlertasDePrazo(eventos: EventoParaCalculo[], hoje: string): Alerta[] {
  const abertos = eventos.filter(estaAberto).sort(porDataEId).map((e) => comPrazo(e, hoje));

  const proximos: Alerta[] = abertos
    .filter((evento) => evento.diasRestantes >= 0 && evento.diasRestantes <= DIAS_PARA_ALERTA)
    .map((evento) => ({
      tipo: "PRAZO_PROXIMO",
      nivel: evento.diasRestantes <= DIAS_URGENTE ? "alto" : "medio",
      disciplina: evento.disciplina,
      evento,
    }));

  const vencidos: Alerta[] = abertos
    .filter((evento) => evento.diasRestantes < 0)
    .reverse()
    .map((evento) => ({ tipo: "PRAZO_VENCIDO", nivel: "medio", disciplina: evento.disciplina, evento }));

  return [...proximos, ...vencidos];
}

export function calcularIndicadoresDaDisciplina(disciplina: DisciplinaParaCalculo, hoje: string) {
  return {
    desempenho: calcularDesempenho(
      disciplina.eventos,
      { regraMedia: disciplina.regraMedia, mediaAprovacao: disciplina.mediaAprovacao },
      hoje
    ),
    frequencia: calcularFrequencia(disciplina.frequencias, {
      cargaHoraria: disciplina.cargaHoraria,
      limiteFaltas: disciplina.limiteFaltas,
    }),
  };
}

/**
 * FREQUENCIA_ACIMA_DO_LIMITE / FREQUENCIA_PERTO_DO_LIMITE: situação da frequência.
 * MEDIA_INALCANCAVEL: nem com 10 nas avaliações restantes chega à média de aprovação.
 * MEDIA_ABAIXO: média (parcial ou final) abaixo da média de aprovação.
 * NOTA_AGUARDANDO: avaliação já concluída, com data passada, ainda sem nota registrada.
 */
export function gerarAlertasAcademicos(
  disciplina: DisciplinaParaCalculo,
  desempenho: Desempenho,
  frequencia: Frequencia,
  hoje: string
): Alerta[] {
  const ref = { id: disciplina.id, nome: disciplina.nome };
  const alertas: Alerta[] = [];

  if (frequencia.situacao === "ACIMA_DO_LIMITE" || frequencia.situacao === "PERTO_DO_LIMITE") {
    alertas.push({
      tipo:
        frequencia.situacao === "ACIMA_DO_LIMITE"
          ? "FREQUENCIA_ACIMA_DO_LIMITE"
          : "FREQUENCIA_PERTO_DO_LIMITE",
      nivel: frequencia.situacao === "ACIMA_DO_LIMITE" ? "alto" : "medio",
      disciplina: ref,
      valores: {
        faltas: frequencia.faltas,
        faltasPermitidas: frequencia.faltasPermitidas,
        percentualFaltas: frequencia.percentualFaltas,
        limiteFaltas: frequencia.limiteFaltas,
      },
    });
  }

  if (desempenho.notaNecessaria && !desempenho.notaNecessaria.alcancavel) {
    alertas.push({
      tipo: "MEDIA_INALCANCAVEL",
      nivel: "alto",
      disciplina: ref,
      valores: { media: desempenho.media, mediaAprovacao: desempenho.mediaAprovacao },
    });
  } else if (desempenho.situacao === "PARCIAL_ABAIXO" || desempenho.situacao === "ABAIXO_DA_MEDIA") {
    alertas.push({
      tipo: "MEDIA_ABAIXO",
      nivel: desempenho.situacao === "ABAIXO_DA_MEDIA" ? "alto" : "medio",
      disciplina: ref,
      valores: {
        media: desempenho.media,
        mediaAprovacao: desempenho.mediaAprovacao,
        notaNecessaria: desempenho.notaNecessaria?.valor ?? null,
      },
    });
  }

  const aguardando = disciplina.eventos.filter(
    (e) => ehAvaliativo(e) && e.nota === null && e.status === "CONCLUIDO" && e.data < hoje
  ).length;

  if (aguardando > 0) {
    alertas.push({ tipo: "NOTA_AGUARDANDO", nivel: "medio", disciplina: ref, valores: { quantidade: aguardando } });
  }

  return alertas;
}

/** Média geral = média aritmética das médias (parciais) das disciplinas que já têm nota. */
export function calcularMediaGeral(medias: (number | null)[]) {
  const comNota = medias.filter((m): m is number => m !== null);
  return {
    valor: comNota.length > 0 ? arredondar(comNota.reduce((a, b) => a + b, 0) / comNota.length) : null,
    disciplinasComNota: comNota.length,
  };
}

export function montarPainel(disciplinas: DisciplinaParaCalculo[], hoje: string) {
  const eventos = disciplinas.flatMap((disciplina) => disciplina.eventos);
  const indicadores = disciplinas.map((d) => calcularIndicadoresDaDisciplina(d, hoje));

  const alertasAcademicos = disciplinas.flatMap((d, i) =>
    gerarAlertasAcademicos(d, indicadores[i].desempenho, indicadores[i].frequencia, hoje)
  );

  // Nível alto primeiro; dentro do mesmo nível, mantém a ordem (prazos por data).
  const alertas = [...gerarAlertasDePrazo(eventos, hoje), ...alertasAcademicos].sort(
    (a, b) => Number(b.nivel === "alto") - Number(a.nivel === "alto")
  );

  const disciplinasEmAtencao = new Set(
    alertasAcademicos.filter((a) => ALERTAS_ACADEMICOS.includes(a.tipo)).map((a) => a.disciplina.id)
  ).size;

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
      mediaGeral: calcularMediaGeral(indicadores.map((i) => i.desempenho.media)),
      avaliacoesAguardandoNota: indicadores.reduce((t, i) => t + i.desempenho.avaliacoes.aguardandoNota, 0),
      disciplinasEmAtencao,
    },
    proximosEventos: proximosEventos(eventos, hoje),
    alertas,
    disciplinas: disciplinas.map((disciplina, i) => ({
      id: disciplina.id,
      nome: disciplina.nome,
      professor: disciplina.professor,
      semestre: disciplina.semestre,
      cargaHoraria: disciplina.cargaHoraria,
      horario: disciplina.horario,
      eventos: contarEventos(disciplina.eventos, hoje),
      proximoEvento: proximosEventos(disciplina.eventos, hoje, 1)[0] ?? null,
      desempenho: indicadores[i].desempenho,
      frequencia: indicadores[i].frequencia,
    })),
  };
}
