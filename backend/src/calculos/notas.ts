import { arredondar } from "./numeros";

export const ESCALA_MEDIA = 10;
export type RegraMedia = "PONDERADA" | "ARITMETICA";

export type Etapa = "M1" | "M2";
export const ETAPAS: Etapa[] = ["M1", "M2"];

export type AvaliacaoParaCalculo = {
  data: string; 
  peso: number;
  nota: number | null;
  notaMaxima: number;
  etapa: Etapa;
};

export type CriteriosDeNota = {
  regraMedia: RegraMedia;
  mediaAprovacao: number | null;
  pesoM1: number;
  pesoM2: number;
};

export type SituacaoNota =
  | "SEM_NOTAS" 
  | "SEM_CRITERIO" 
  | "PARCIAL_ACIMA" 
  | "PARCIAL_ABAIXO" 
  | "ATINGIU_MEDIA"
  | "ABAIXO_DA_MEDIA"; 

export type EtapaParaNotaNecessaria = {
  peso: number;
  somaPonderada: number; 
  pesoLancado: number; 
  pesoRestante: number; 
};

export function ehAvaliativo(evento: Pick<AvaliacaoParaCalculo, "peso">) {
  return evento.peso > 0;
}

export function notaNaEscala(nota: number, notaMaxima: number) {
  return (nota / notaMaxima) * ESCALA_MEDIA;
}


function pesoNaRegra(avaliacao: AvaliacaoParaCalculo, regra: RegraMedia) {
  return regra === "PONDERADA" ? avaliacao.peso : 1;
}

export function calcularNotaNecessaria(etapas: EtapaParaNotaNecessaria[], mediaAprovacao: number) {
  let garantido = 0; 
  let emAberto = 0; 
  let pesoDasEtapas = 0;

  for (const etapa of etapas) {
    const pesoDaEtapa = etapa.pesoLancado + etapa.pesoRestante;
    pesoDasEtapas += etapa.peso;

    if (pesoDaEtapa > 0) {
      garantido += etapa.peso * (etapa.somaPonderada / pesoDaEtapa);
      emAberto += etapa.peso * (etapa.pesoRestante / pesoDaEtapa);
    } else {
      emAberto += etapa.peso;
    }
  }

  if (emAberto <= 0) return null;

  const necessaria = (mediaAprovacao * pesoDasEtapas - garantido) / emAberto;

  return {
    valor: arredondar(Math.max(0, necessaria)),
    alcancavel: arredondar(necessaria) <= ESCALA_MEDIA,
  };
}

function calcularEtapa(etapa: Etapa, peso: number, avaliacoes: AvaliacaoParaCalculo[], regra: RegraMedia) {
  const daEtapa = avaliacoes.filter((a) => a.etapa === etapa);
  const comNota = daEtapa.filter((a) => a.nota !== null);
  const semNota = daEtapa.filter((a) => a.nota === null);

  const somaPonderada = comNota.reduce(
    (soma, a) => soma + notaNaEscala(a.nota!, a.notaMaxima) * pesoNaRegra(a, regra),
    0
  );
  const pesoLancado = comNota.reduce((soma, a) => soma + pesoNaRegra(a, regra), 0);
  const pesoRestante = semNota.reduce((soma, a) => soma + pesoNaRegra(a, regra), 0);

  return {
    etapa,
    peso,
    media: pesoLancado > 0 ? arredondar(somaPonderada / pesoLancado) : null,
    completa: daEtapa.length > 0 && semNota.length === 0,
    avaliacoes: { total: daEtapa.length, comNota: comNota.length, semNota: semNota.length },
    somaPonderada,
    pesoLancado,
    pesoRestante,
  };
}

export function calcularDesempenho(
  eventos: AvaliacaoParaCalculo[],
  criterios: CriteriosDeNota,
  hoje: string
) {
  const avaliacoes = eventos.filter(ehAvaliativo);
  const comNota = avaliacoes.filter((a) => a.nota !== null);
  const semNota = avaliacoes.filter((a) => a.nota === null);

  const pesos: Record<Etapa, number> = { M1: criterios.pesoM1, M2: criterios.pesoM2 };
  const etapas = ETAPAS.map((etapa) => calcularEtapa(etapa, pesos[etapa], avaliacoes, criterios.regraMedia));

  const comMedia = etapas.filter((etapa) => etapa.media !== null);
  const pesoDasEtapasComMedia = comMedia.reduce((soma, etapa) => soma + etapa.peso, 0);
  const media =
    pesoDasEtapasComMedia > 0
      ? arredondar(comMedia.reduce((soma, etapa) => soma + etapa.media! * etapa.peso, 0) / pesoDasEtapasComMedia)
      : null;

  const final = etapas.every((etapa) => etapa.completa);
  const { mediaAprovacao } = criterios;

  let situacao: SituacaoNota;
  if (media === null) situacao = "SEM_NOTAS";
  else if (mediaAprovacao === null) situacao = "SEM_CRITERIO";
  else if (final) situacao = media >= mediaAprovacao ? "ATINGIU_MEDIA" : "ABAIXO_DA_MEDIA";
  else situacao = media >= mediaAprovacao ? "PARCIAL_ACIMA" : "PARCIAL_ABAIXO";

  return {
    regraMedia: criterios.regraMedia,
    mediaAprovacao,
    media,
    final,
    situacao,
    etapas: etapas.map(({ etapa, peso, media: mediaDaEtapa, completa, avaliacoes: contagem }) => ({
      etapa,
      peso,
      media: mediaDaEtapa,
      completa,
      avaliacoes: contagem,
    })),
    avaliacoes: {
      total: avaliacoes.length,
      comNota: comNota.length,
      semNota: semNota.length,
      aguardandoNota: semNota.filter((a) => a.data <= hoje).length, 
      naoAvaliativos: eventos.length - avaliacoes.length,
    },
    notaNecessaria: mediaAprovacao === null ? null : calcularNotaNecessaria(etapas, mediaAprovacao),
  };
}

export type Desempenho = ReturnType<typeof calcularDesempenho>;
