import { dataDeHoje, diasEntre, paraDataISO } from "../calculos/prazos";
import {
  DisciplinaParaCalculo,
  EventoParaCalculo,
  contarEventos,
  gerarAlertasDePrazo,
  montarPainel,
  proximosEventos,
} from "../calculos/painel";

const HOJE = "2026-10-13";
const CALCULO = { id: 1, nome: "Cálculo I" };
const BANCO = { id: 2, nome: "Banco de Dados" };

let proximoId = 1;

function evento(dados: Partial<EventoParaCalculo> & Pick<EventoParaCalculo, "data">): EventoParaCalculo {
  return {
    id: proximoId++,
    titulo: "Avaliação",
    tipo: "PROVA",
    peso: 1,
    status: "PENDENTE",
    disciplina: CALCULO,
    ...dados,
  };
}

describe("Cálculos de prazo", () => {
  it("usa o fuso de Brasília para definir o dia de hoje", () => {
    // 01:30 UTC do dia 14 ainda é dia 13 em São Paulo (UTC-3).
    const agora = new Date("2026-10-14T01:30:00Z");

    expect(dataDeHoje(agora, "America/Sao_Paulo")).toBe("2026-10-13");
    expect(dataDeHoje(agora, "UTC")).toBe("2026-10-14");
  });

  it("converte a data do banco para AAAA-MM-DD", () => {
    expect(paraDataISO(new Date("2026-11-20T00:00:00.000Z"))).toBe("2026-11-20");
    expect(paraDataISO("2026-11-20T00:00:00.000Z")).toBe("2026-11-20");
  });

  it("conta dias corridos, inclusive entre meses e anos", () => {
    expect(diasEntre("2026-10-13", "2026-10-13")).toBe(0);
    expect(diasEntre("2026-10-13", "2026-10-16")).toBe(3);
    expect(diasEntre("2026-10-13", "2026-10-10")).toBe(-3);
    expect(diasEntre("2026-12-30", "2027-01-02")).toBe(3);
    expect(diasEntre("2028-02-28", "2028-03-01")).toBe(2); // ano bissexto
  });

  it("recusa data fora do formato", () => {
    expect(() => diasEntre("13/10/2026", "2026-10-14")).toThrow("Data inválida");
  });
});

describe("Indicadores do Dashboard", () => {
  it("conta eventos por status e identifica os atrasados", () => {
    const eventos = [
      evento({ data: "2026-10-10", status: "PENDENTE" }), // atrasado
      evento({ data: "2026-10-12", status: "EM_ANDAMENTO" }), // atrasado
      evento({ data: "2026-10-01", status: "CONCLUIDO" }), // concluído não atrasa
      evento({ data: "2026-10-13", status: "PENDENTE" }), // hoje não está atrasado
      evento({ data: "2026-10-20", status: "EM_ANDAMENTO" }),
    ];

    expect(contarEventos(eventos, HOJE)).toEqual({
      total: 5,
      pendentes: 2,
      emAndamento: 2,
      concluidos: 1,
      abertos: 4,
      atrasados: 2,
    });
  });

  it("lista os próximos eventos não concluídos em ordem de data, com dias restantes", () => {
    const eventos = [
      evento({ titulo: "Passado", data: "2026-10-12" }),
      evento({ titulo: "Concluído", data: "2026-10-14", status: "CONCLUIDO" }),
      evento({ titulo: "Depois", data: "2026-10-30" }),
      evento({ titulo: "Hoje", data: "2026-10-13" }),
      evento({ titulo: "Amanhã", data: "2026-10-14", status: "EM_ANDAMENTO" }),
    ];

    const proximos = proximosEventos(eventos, HOJE);

    expect(proximos.map((e) => [e.titulo, e.diasRestantes])).toEqual([
      ["Hoje", 0],
      ["Amanhã", 1],
      ["Depois", 17],
    ]);
  });

  it("respeita o limite de próximos eventos", () => {
    const eventos = Array.from({ length: 10 }, (_, i) =>
      evento({ data: `2026-10-${String(14 + i).padStart(2, "0")}` })
    );

    expect(proximosEventos(eventos, HOJE)).toHaveLength(6);
    expect(proximosEventos(eventos, HOJE, 2)).toHaveLength(2);
  });

  it("gera alertas de prazo próximo (até 7 dias) e de prazo vencido sem conclusão", () => {
    const eventos = [
      evento({ titulo: "Em 2 dias", data: "2026-10-15" }),
      evento({ titulo: "Em 7 dias", data: "2026-10-20" }),
      evento({ titulo: "Em 8 dias", data: "2026-10-21" }),
      evento({ titulo: "Vencido", data: "2026-10-05" }),
      evento({ titulo: "Concluído", data: "2026-10-14", status: "CONCLUIDO" }),
    ];

    const alertas = gerarAlertasDePrazo(eventos, HOJE);

    expect(alertas.map((a) => [a.tipo, a.nivel, a.evento.titulo])).toEqual([
      ["PRAZO_PROXIMO", "alto", "Em 2 dias"],
      ["PRAZO_PROXIMO", "medio", "Em 7 dias"],
      ["PRAZO_VENCIDO", "medio", "Vencido"],
    ]);
    expect(alertas[2].evento.diasRestantes).toBe(-8);
  });

  it("monta o painel sem inventar dados quando não há disciplinas", () => {
    const painel = montarPainel([], HOJE);

    expect(painel.resumo).toEqual({
      disciplinas: 0,
      eventos: { total: 0, pendentes: 0, emAndamento: 0, concluidos: 0, abertos: 0, atrasados: 0 },
      prazosProximos: 0,
    });
    expect(painel.proximosEventos).toEqual([]);
    expect(painel.alertas).toEqual([]);
    expect(painel.disciplinas).toEqual([]);
    expect(painel.semestres).toEqual([]);
  });

  it("consolida os eventos de todas as disciplinas e resume cada uma", () => {
    const disciplinas: DisciplinaParaCalculo[] = [
      {
        ...BANCO,
        professor: null,
        semestre: "2026.2",
        cargaHoraria: 64,
        horario: null,
        eventos: [
          evento({ titulo: "Prova de SQL", data: "2026-10-16", disciplina: BANCO }),
          evento({ titulo: "Lista", data: "2026-10-01", status: "CONCLUIDO", disciplina: BANCO }),
        ],
      },
      {
        ...CALCULO,
        professor: "Helena",
        semestre: "2026.1",
        cargaHoraria: null,
        horario: "Seg e Qua",
        eventos: [evento({ titulo: "Prova 2", data: "2026-10-14" })],
      },
    ];

    const painel = montarPainel(disciplinas, HOJE);

    expect(painel.resumo.disciplinas).toBe(2);
    expect(painel.resumo.eventos.total).toBe(3);
    expect(painel.resumo.prazosProximos).toBe(2);
    expect(painel.semestres).toEqual(["2026.2", "2026.1"]);
    expect(painel.proximosEventos.map((e) => e.titulo)).toEqual(["Prova 2", "Prova de SQL"]);
    expect(painel.disciplinas[0]).toMatchObject({
      nome: "Banco de Dados",
      eventos: { total: 2, concluidos: 1, abertos: 1 },
      proximoEvento: { titulo: "Prova de SQL", diasRestantes: 3 },
    });
  });
});
