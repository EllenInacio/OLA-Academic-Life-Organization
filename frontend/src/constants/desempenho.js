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
  SEM_LIMITE: { rotulo: "Limite de faltas não definido", classe: "neutra" },
  DENTRO_DO_LIMITE: { rotulo: "Dentro do limite", classe: "boa" },
  PERTO_DO_LIMITE: { rotulo: "Perto do limite", classe: "atencao" },
  ACIMA_DO_LIMITE: { rotulo: "Limite ultrapassado", classe: "critica" },
};

export function estadoDaMedia(desempenho) {
  if (desempenho.media === null) {
    return { final: false, rotulo: "Média geral", curto: "sem notas", detalhe: "Nenhuma nota lançada ainda." };
  }

  if (desempenho.final) {
    return {
      final: true,
      rotulo: "Média final geral",
      curto: "média final",
      detalhe: "Média final: a M1 e a M2 estão com todas as notas lançadas.",
    };
  }

  const comNota = desempenho.etapas.filter((etapa) => etapa.media !== null).map((etapa) => etapa.etapa);
  const semNota = desempenho.etapas.filter((etapa) => etapa.media === null).map((etapa) => etapa.etapa);

  if (semNota.length > 0) {
    return {
      final: false,
      rotulo: "Média geral parcial",
      curto: `média parcial, só ${comNota.join(" e ")}`,
      detalhe: `Resultado provisório: a ${semNota.join(" e a ")} ainda não possui notas, então a média geral considera só a ${comNota.join(" e a ")}.`,
    };
  }

  return {
    final: false,
    rotulo: "Média geral parcial",
    curto: "média parcial, faltam notas",
    detalhe: "Resultado provisório: a M1 e a M2 já têm notas, mas ainda há avaliações sem nota lançada.",
  };
}

export function rotuloRegra(valor, curto = false) {
  const regra = REGRAS_MEDIA.find((item) => item.valor === valor);
  return regra ? (curto ? regra.curto : regra.rotulo) : valor;
}
