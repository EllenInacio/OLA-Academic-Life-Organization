export const REGRAS_MEDIA = [
  { valor: "PONDERADA", rotulo: "Média ponderada (pelos pesos)", curto: "Média ponderada" },
  { valor: "ARITMETICA", rotulo: "Média aritmética simples", curto: "Média aritmética" },
];

export const SITUACAO_NOTA = {
  SEM_NOTAS: { rotulo: "Sem notas lançadas", classe: "neutra" },
  SEM_CRITERIO: { rotulo: "Média de aprovação não definida", classe: "neutra" },
  PARCIAL_ACIMA: { rotulo: "Parcial: acima da média", classe: "boa" },
  PARCIAL_ABAIXO: { rotulo: "Parcial: abaixo da média", classe: "atencao" },
  ATINGIU_MEDIA: { rotulo: "Atingiu a média", classe: "boa" },
  ABAIXO_DA_MEDIA: { rotulo: "Abaixo da média", classe: "critica" },
};

export const SITUACAO_FREQUENCIA = {
  SEM_REGISTROS: { rotulo: "Sem registros", classe: "neutra" },
  DENTRO_DO_LIMITE: { rotulo: "Dentro do limite", classe: "boa" },
  PERTO_DO_LIMITE: { rotulo: "Perto do limite", classe: "atencao" },
  ACIMA_DO_LIMITE: { rotulo: "Limite ultrapassado", classe: "critica" },
};

export function rotuloRegra(valor, curto = false) {
  const regra = REGRAS_MEDIA.find((item) => item.valor === valor);
  return regra ? (curto ? regra.curto : regra.rotulo) : valor;
}
