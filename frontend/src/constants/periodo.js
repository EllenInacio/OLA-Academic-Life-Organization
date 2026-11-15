export const PERIODO_NUMERO_MAXIMO = 12;

export const OPCOES_PERIODO = [
  { valor: "", rotulo: "Não informado" },
  ...Array.from({ length: PERIODO_NUMERO_MAXIMO }, (_, i) => ({
    valor: `SEMESTRE:${i + 1}`,
    rotulo: `${i + 1}º semestre`,
  })),
  { valor: "EXAME", rotulo: "Exame/Recuperação" },
];

export function valorDoPeriodo(disciplina) {
  if (disciplina.periodoTipo === "EXAME") return "EXAME";
  if (disciplina.periodoTipo === "SEMESTRE" && disciplina.periodoNumero) return `SEMESTRE:${disciplina.periodoNumero}`;
  return "";
}

export function periodoDoValor(valor) {
  if (valor === "EXAME") return { periodoTipo: "EXAME", periodoNumero: null };
  if (valor.startsWith("SEMESTRE:")) return { periodoTipo: "SEMESTRE", periodoNumero: Number(valor.split(":")[1]) };
  return { periodoTipo: null, periodoNumero: null };
}

export function rotuloPeriodo(disciplina) {
  return OPCOES_PERIODO.find((opcao) => opcao.valor !== "" && opcao.valor === valorDoPeriodo(disciplina))?.rotulo ?? null;
}
