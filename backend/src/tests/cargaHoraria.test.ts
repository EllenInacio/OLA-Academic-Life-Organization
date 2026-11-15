import { calcularCargaHoraria, contarDiaDaSemana, lerEncontros } from "../calculos/cargaHoraria";

const AGOSTO_A_DEZEMBRO = { inicioAulas: "2026-08-03", fimAulas: "2026-12-18" };
const SEGUNDA = 1;
const QUARTA = 3;
const DOMINGO = 0;

function contarDiaADia(inicioISO: string, fimISO: string, diaDaSemana: number) {
  let vezes = 0;
  for (let dia = Date.parse(`${inicioISO}T00:00:00Z`); dia <= Date.parse(`${fimISO}T00:00:00Z`); dia += 86400000) {
    if (new Date(dia).getUTCDay() === diaDaSemana) vezes += 1;
  }
  return vezes;
}

describe("Carga horária da disciplina", () => {
  it("conta quantas vezes cada dia da semana cai dentro do período", () => {
    expect(contarDiaDaSemana("2026-08-03", "2026-12-18", SEGUNDA)).toBe(20);
    expect(contarDiaDaSemana("2026-08-03", "2026-12-18", QUARTA)).toBe(20);
    expect(contarDiaDaSemana("2026-08-03", "2026-08-08", DOMINGO)).toBe(0);
    expect(contarDiaDaSemana("2026-08-03", "2026-08-03", SEGUNDA)).toBe(1);
    expect(contarDiaDaSemana("2026-12-18", "2026-08-03", SEGUNDA)).toBe(0);
  });

  it("dá a mesma contagem que percorrer o calendário dia a dia", () => {
    const datas = ["2026-08-03", "2026-08-05", "2026-08-09", "2026-11-30", "2026-12-18", "2027-02-28"];

    for (const inicio of datas) {
      for (const fim of datas.filter((data) => data >= inicio)) {
        for (let dia = 0; dia < 7; dia += 1) {
          expect(contarDiaDaSemana(inicio, fim, dia)).toBe(contarDiaADia(inicio, fim, dia));
        }
      }
    }
  });

  it("lê os dias e a duração de cada encontro", () => {
    expect(lerEncontros("Seg 19:00–22:00, Qua 19:00–20:40")).toEqual([
      { diaDaSemana: SEGUNDA, minutos: 180 },
      { diaDaSemana: QUARTA, minutos: 100 },
    ]);
  });

  it("calcula a carga horária de agosto a dezembro com um dia de aula por semana", () => {
    const calculo = calcularCargaHoraria({ horario: "Seg 19:00–22:00", ...AGOSTO_A_DEZEMBRO });

    expect(calculo).toEqual({ horas: 60, diasDeAula: 20, minutos: 3600 });
  });

  it("soma os encontros de disciplinas com mais de um dia de aula na semana", () => {
    const calculo = calcularCargaHoraria({ horario: "Seg 19:00–22:00, Qua 19:00–22:00", ...AGOSTO_A_DEZEMBRO });

    expect(calculo).toEqual({ horas: 120, diasDeAula: 40, minutos: 7200 });
  });

  it("usa a duração de cada dia e arredonda para horas inteiras", () => {
    const calculo = calcularCargaHoraria({ horario: "Seg 19:00–22:00, Qua 19:00–20:40", ...AGOSTO_A_DEZEMBRO });

    expect(calculo).toEqual({ horas: 93, diasDeAula: 40, minutos: 5600 });
  });

  it("não conta datas fora do período informado", () => {
    const umaSemana = calcularCargaHoraria({
      horario: "Seg 19:00–22:00, Qua 19:00–22:00",
      inicioAulas: "2026-08-03",
      fimAulas: "2026-08-07",
    });
    const semanaSemDomingo = calcularCargaHoraria({
      horario: "Dom 08:00–12:00",
      inicioAulas: "2026-08-03",
      fimAulas: "2026-08-08",
    });

    expect(umaSemana).toEqual({ horas: 6, diasDeAula: 2, minutos: 360 });
    expect(semanaSemDomingo).toBeNull();
  });

  it("recalcula quando as datas ou os horários mudam", () => {
    const ateNovembro = calcularCargaHoraria({ horario: "Seg 19:00–22:00", inicioAulas: "2026-08-03", fimAulas: "2026-11-30" });
    const ateDezembro = calcularCargaHoraria({ horario: "Seg 19:00–22:00", ...AGOSTO_A_DEZEMBRO });
    const aulaMaisLonga = calcularCargaHoraria({ horario: "Seg 19:00–23:00", ...AGOSTO_A_DEZEMBRO });

    expect([ateNovembro?.horas, ateDezembro?.horas, aulaMaisLonga?.horas]).toEqual([54, 60, 80]);
  });

  it.each([
    ["sem horário", { horario: null, ...AGOSTO_A_DEZEMBRO }],
    ["sem data de início", { horario: "Seg 19:00–22:00", inicioAulas: null, fimAulas: "2026-12-18" }],
    ["sem data de fim", { horario: "Seg 19:00–22:00", inicioAulas: "2026-08-03", fimAulas: "" }],
    ["fim antes do início", { horario: "Seg 19:00–22:00", inicioAulas: "2026-12-18", fimAulas: "2026-08-03" }],
    ["término antes do início da aula", { horario: "Seg 22:00–19:00", ...AGOSTO_A_DEZEMBRO }],
    ["horário em texto livre", { horario: "Seg e Qua · 08:00–09:40", ...AGOSTO_A_DEZEMBRO }],
    ["hora inexistente", { horario: "Seg 25:00–26:00", ...AGOSTO_A_DEZEMBRO }],
  ])("não calcula %s", (_caso, aulas) => {
    expect(calcularCargaHoraria(aulas)).toBeNull();
  });
});
