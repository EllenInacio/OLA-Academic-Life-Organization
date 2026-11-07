import { arredondar } from "./numeros";

export const ESCALA_MEDIA = 10;
export type RegraMedia = "PONDERADA" | "ARITMETICA";
export type AvaliacaoParaCalculo = {
  data: string; // AAAA-MM-DD
  peso: number;
  nota: number | null;
  notaMaxima: number;
};

export type CriteriosDeNota = {
  regraMedia: RegraMedia;
  mediaAprovacao: number | null;
};

export type SituacaoNota =
  | "SEM_NOTAS" 
  | "SEM_CRITERIO" 
  | "PARCIAL_ACIMA" 
  | "PARCIAL_ABAIXO" 
  | "ATINGIU_MEDIA"
  | "ABAIXO_DA_MEDIA"; 

export function ehAvaliativo(evento: Pick<AvaliacaoParaCalculo, "peso">) {
  return evento.peso > 0;
}

export function notaNaEscala(nota: number, notaMaxima: number) {
  return (nota / notaMaxima) * ESCALA_MEDIA;
}


function pesoNaRegra(avaliacao: AvaliacaoParaCalculo, regra: RegraMedia) {
  return regra === "PONDERADA" ? avaliacao.peso : 1;
}

export function calcularNotaNecessaria(
  somaPonderada: number,
  pesoLancado: number,
  pesoRestante: number,
  mediaAprovacao: number
) {
  if (pesoRestante <= 0) return null;

  const necessaria = (mediaAprovacao * (pesoLancado + pesoRestante) - somaPonderada) / pesoRestante;

  return {
    valor: arredondar(Math.max(0, necessaria)),
    alcancavel: necessaria <= ESCALA_MEDIA,
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

  const somaPonderada = comNota.reduce(
    (soma, a) => soma + notaNaEscala(a.nota!, a.notaMaxima) * pesoNaRegra(a, criterios.regraMedia),
    0
  );
  const pesoLancado = comNota.reduce((soma, a) => soma + pesoNaRegra(a, criterios.regraMedia), 0);
  const pesoRestante = semNota.reduce((soma, a) => soma + pesoNaRegra(a, criterios.regraMedia), 0);

  const media = pesoLancado > 0 ? arredondar(somaPonderada / pesoLancado) : null;
  const final = avaliacoes.length > 0 && semNota.length === 0;
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
    avaliacoes: {
      total: avaliacoes.length,
      comNota: comNota.length,
      semNota: semNota.length,
      aguardandoNota: semNota.filter((a) => a.data <= hoje).length, 
      naoAvaliativos: eventos.length - avaliacoes.length,
    },
    notaNecessaria:
      mediaAprovacao === null
        ? null
        : calcularNotaNecessaria(somaPonderada, pesoLancado, pesoRestante, mediaAprovacao),
  };
}

export type Desempenho = ReturnType<typeof calcularDesempenho>;
