import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Selo from "./Selo";
import { ETAPA_PADRAO, TIPOS_EVENTO, rotuloDe } from "../constants/evento";
import { SITUACAO_NOTA, estadoDaMedia, rotuloRegra } from "../constants/desempenho";
import { formatarData, formatarNumero, hojeISO, lerNumero, plural } from "../utils/formatacao";

const NOVA_AVALIACAO = { titulo: "", tipo: "PROVA", data: "", peso: "1", nota: "", notaMaxima: "10" };

function textoNota(nota) {
  return nota === null || nota === undefined ? "" : formatarNumero(Number(nota), 2);
}

function LinhaAvaliacao({ avaliacao, outraEtapa, aoLancar, aoRemover, aoMudarEtapa }) {
  const [valor, setValor] = useState(textoNota(avaliacao.nota));
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setValor(textoNota(avaliacao.nota));
    setErro("");
  }, [avaliacao.nota]);

  const notaMaxima = Number(avaliacao.notaMaxima);
  const alterada = valor.trim() !== textoNota(avaliacao.nota);
  const semNota = avaliacao.nota === null;
  const jaAconteceu = avaliacao.diasRestantes <= 0;

  async function salvar(evento) {
    evento.preventDefault();
    const nota = lerNumero(valor);

    if (Number.isNaN(nota) || nota < 0 || nota > notaMaxima) {
      setErro(`Informe uma nota entre 0 e ${formatarNumero(notaMaxima)}.`);
      return;
    }

    setErro("");
    setSalvando(true);
    await aoLancar(avaliacao, nota);
    setSalvando(false);
  }

  return (
    <li className="avaliacao">
      <form className="avaliacao-linha" onSubmit={salvar}>
        <div className="avaliacao-info">
          <span className="avaliacao-titulo">{avaliacao.titulo}</span>
          <span className="avaliacao-detalhe">
            {rotuloDe(TIPOS_EVENTO, avaliacao.tipo)} · peso {formatarNumero(Number(avaliacao.peso), 2)} ·{" "}
            {formatarData(avaliacao.data)}
          </span>
          {semNota && (
            <span className={`selo ${jaAconteceu ? "selo-atencao" : "selo-neutra"}`}>
              {jaAconteceu ? "Aguardando nota" : "Ainda não realizada"}
            </span>
          )}
          <button
            type="button"
            className="avaliacao-mover"
            onClick={() => aoMudarEtapa(avaliacao, outraEtapa)}
            title={`Esta avaliação passa a contar na média da ${outraEtapa}`}
          >
            Mover para {outraEtapa}
          </button>
        </div>

        <div className="avaliacao-nota">
          <input
            aria-label={`Nota de ${avaliacao.titulo}`}
            inputMode="decimal"
            value={valor}
            onChange={(e) => {
              setValor(e.target.value);
              setErro("");
            }}
            placeholder="–"
          />
          <span className="avaliacao-maxima">/ {formatarNumero(notaMaxima)}</span>
          {alterada && valor.trim() !== "" && (
            <button type="submit" className="botao-principal botao-pequeno" disabled={salvando}>
              {salvando ? "..." : "Salvar"}
            </button>
          )}
          {!semNota && !alterada && (
            <button
              type="button"
              className="botao-icone"
              onClick={() => aoRemover(avaliacao)}
              aria-label={`Remover nota de ${avaliacao.titulo}`}
              title="Remover nota"
            >
              ×
            </button>
          )}
        </div>
      </form>
      {erro && <p className="erro-campo">{erro}</p>}
    </li>
  );
}

function NovaAvaliacaoForm({ etapa, aoCriar }) {
  const [campos, setCampos] = useState(NOVA_AVALIACAO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function alterar(campo, valor) {
    setCampos((atuais) => ({ ...atuais, [campo]: valor }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    const peso = lerNumero(campos.peso);
    const notaMaxima = lerNumero(campos.notaMaxima);
    const nota = campos.nota.trim() === "" ? null : lerNumero(campos.nota);

    if (!campos.titulo.trim()) return setErro("Informe o nome da avaliação.");
    if (!campos.data) return setErro("Informe a data da avaliação.");
    if (Number.isNaN(peso) || peso <= 0) return setErro("O peso deve ser maior que zero.");
    if (Number.isNaN(notaMaxima) || notaMaxima <= 0) return setErro("A nota máxima deve ser maior que zero.");
    if (nota !== null && (Number.isNaN(nota) || nota < 0 || nota > notaMaxima)) {
      return setErro(`A nota deve estar entre 0 e ${formatarNumero(notaMaxima)}.`);
    }

    setErro("");
    setSalvando(true);
    const salvou = await aoCriar({
      titulo: campos.titulo.trim(),
      tipo: campos.tipo,
      etapa,
      data: campos.data,
      peso,
      notaMaxima,
      ...(nota !== null && { nota }),
    });
    setSalvando(false);
    if (salvou) setCampos(NOVA_AVALIACAO);
  }

  return (
    <form className="nova-avaliacao" onSubmit={enviar} noValidate>
      <h3>Nova avaliação da {etapa}</h3>
      {erro && <p className="erro-campo">{erro}</p>}

      <div className="nova-avaliacao-campos">
        <div className="campo campo-largo">
          <label htmlFor="av-titulo">Nome</label>
          <input
            id="av-titulo"
            value={campos.titulo}
            onChange={(e) => alterar("titulo", e.target.value)}
            placeholder="Ex.: Lista avaliativa 2"
            maxLength={150}
          />
        </div>
        <div className="campo">
          <label htmlFor="av-tipo">Tipo</label>
          <select id="av-tipo" value={campos.tipo} onChange={(e) => alterar("tipo", e.target.value)}>
            {TIPOS_EVENTO.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.rotulo}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="av-data">Data</label>
          <input id="av-data" type="date" value={campos.data} onChange={(e) => alterar("data", e.target.value)} />
        </div>
        <div className="campo campo-curto">
          <label htmlFor="av-peso">Peso</label>
          <input id="av-peso" inputMode="decimal" value={campos.peso} onChange={(e) => alterar("peso", e.target.value)} />
        </div>
        <div className="campo campo-curto">
          <label htmlFor="av-nota">Nota</label>
          <input
            id="av-nota"
            inputMode="decimal"
            value={campos.nota}
            onChange={(e) => alterar("nota", e.target.value)}
            placeholder="opcional"
          />
        </div>
        <div className="campo campo-curto">
          <label htmlFor="av-maxima">Nota máx.</label>
          <input
            id="av-maxima"
            inputMode="decimal"
            value={campos.notaMaxima}
            onChange={(e) => alterar("notaMaxima", e.target.value)}
          />
        </div>
      </div>

      <div className="nova-avaliacao-rodape">
        <p className="cartao-dica">Entra na média da {etapa} e também aparece no calendário.</p>
        <button type="submit" className="botao-principal" disabled={salvando}>
          {salvando ? "Salvando..." : "Adicionar avaliação"}
        </button>
      </div>
    </form>
  );
}

function situacaoDaEtapa(etapa) {
  if (etapa.avaliacoes.total === 0) return "sem avaliações";
  if (etapa.media === null) return "ainda sem notas";
  return `${etapa.completa ? "final" : "parcial"} · ${etapa.avaliacoes.comNota} de ${plural(etapa.avaliacoes.total, "nota", "notas")}`;
}

function ondeFaltaNota(etapas) {
  const emAberto = etapas.filter((etapa) => etapa.avaliacoes.total === 0 || etapa.avaliacoes.semNota > 0);

  if (emAberto.length !== 1) return "no que ainda falta lançar na M1 e na M2";

  const [etapa] = emAberto;
  return etapa.avaliacoes.total === 0
    ? `na ${etapa.etapa}`
    : `nas avaliações da ${etapa.etapa} que ainda estão sem nota`;
}

function QuantoFalta({ disciplina, desempenho }) {
  const { media, mediaAprovacao, notaNecessaria } = desempenho;

  if (mediaAprovacao === null) {
    return (
      <p className="cartao-dica">
        Defina a média de aprovação da disciplina para ver quanto falta.{" "}
        <Link to={`/disciplinas?editar=${disciplina.id}`}>Definir média de aprovação</Link>
      </p>
    );
  }

  const alvo = formatarNumero(mediaAprovacao);

  if (!notaNecessaria) {
    if (media === null) return null;

    return media >= mediaAprovacao ? (
      <p className="texto-bom">
        Média final geral <strong>{formatarNumero(media)}</strong>: você atingiu a média de aprovação ({alvo}).
      </p>
    ) : (
      <p className="texto-critico">
        Média final geral <strong>{formatarNumero(media)}</strong>: faltaram{" "}
        <strong>{formatarNumero(mediaAprovacao - media)}</strong> para a média de aprovação ({alvo}).
      </p>
    );
  }

  if (!notaNecessaria.alcancavel) {
    return (
      <p className="texto-critico">
        Mesmo tirando 10 em tudo o que ainda falta, a média final geral não chega a {alvo} com as notas já
        lançadas.
      </p>
    );
  }

  if (notaNecessaria.valor === 0) {
    return <p className="texto-bom">Com as notas lançadas, a média de aprovação ({alvo}) já está garantida.</p>;
  }

  return (
    <p className="texto-atencao">
      Quanto falta: para fechar com média final geral {alvo}, você precisa de média{" "}
      <strong>{formatarNumero(notaNecessaria.valor)}</strong> {ondeFaltaNota(desempenho.etapas)}.
    </p>
  );
}

function ExplicacaoMedia({ disciplina, desempenho }) {
  const formula =
    desempenho.regraMedia === "PONDERADA"
      ? "Σ(nota × peso) ÷ Σ(pesos)"
      : "soma das notas ÷ quantidade de avaliações";

  const [m1, m2] = desempenho.etapas;
  const somaDosPesos = m1.peso + m2.peso;

  return (
    <div className="explicacao-calculo">
      <p>
        <strong>Média M1 e média M2:</strong> {rotuloRegra(desempenho.regraMedia, true).toLowerCase()} ={" "}
        {formula}, só com as avaliações da etapa que já têm nota. Avaliação sem nota não conta como zero.
        Notas em outra escala são convertidas para 0–10 pela nota máxima e eventos com peso 0 não entram.
      </p>
      <p>
        <strong>Média final geral:</strong> (M1 × {formatarNumero(m1.peso)} + M2 × {formatarNumero(m2.peso)}) ÷{" "}
        {formatarNumero(somaDosPesos)}
        {m1.media !== null && m2.media !== null && (
          <>
            {" "}
            = ({formatarNumero(m1.media)} × {formatarNumero(m1.peso)} + {formatarNumero(m2.media)} ×{" "}
            {formatarNumero(m2.peso)}) ÷ {formatarNumero(somaDosPesos)} ={" "}
            <strong>{formatarNumero(desempenho.media)}</strong>
          </>
        )}
        .{" "}
        {(m1.media === null || m2.media === null) &&
          "Enquanto uma etapa não tem nota, a média geral é parcial e considera só a outra. "}
        <Link to={`/disciplinas?editar=${disciplina.id}`}>Alterar pesos e média de aprovação</Link>
      </p>
      <p className="cartao-dica">Resultado calculado a partir das notas que você lançou; não substitui o boletim oficial.</p>
    </div>
  );
}

export default function NotasCard({ disciplina, aoLancar, aoRemover, aoCriar, aoMudarEtapa }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(ETAPA_PADRAO);

  const { desempenho } = disciplina.resumo;
  const etapaAtual = desempenho.etapas.find((etapa) => etapa.etapa === etapaSelecionada) ?? desempenho.etapas[0];
  const outraEtapa = desempenho.etapas.find((etapa) => etapa.etapa !== etapaAtual.etapa).etapa;
  const avaliacoes = disciplina.eventos.filter(
    (evento) => Number(evento.peso) > 0 && (evento.etapa ?? ETAPA_PADRAO) === etapaAtual.etapa
  );
  const hoje = hojeISO();
  const estado = estadoDaMedia(desempenho);

  return (
    <section className="cartao-academico" aria-labelledby="titulo-notas">
      <header className="cartao-academico-topo">
        <div>
          <h2 id="titulo-notas">Notas</h2>
          <p>
            {disciplina.nome}
            {disciplina.professor ? ` · ${disciplina.professor}` : ""}
          </p>
        </div>
      </header>

      <div className="resumo-medias" role="group" aria-label="Médias da disciplina">
        {desempenho.etapas.map((etapa) => (
          <button
            key={etapa.etapa}
            type="button"
            className="resumo-media"
            aria-pressed={etapa.etapa === etapaAtual.etapa}
            onClick={() => setEtapaSelecionada(etapa.etapa)}
          >
            <span className="resumo-media-rotulo">Média {etapa.etapa}</span>
            <strong>{etapa.media === null ? "—" : formatarNumero(etapa.media)}</strong>
            <span className="resumo-media-detalhe">{situacaoDaEtapa(etapa)}</span>
            <span className="resumo-media-detalhe">peso {formatarNumero(etapa.peso)}</span>
          </button>
        ))}
        <div className="resumo-media resumo-media-geral">
          <span className="resumo-media-rotulo">Média final geral</span>
          <strong>{desempenho.media === null ? "—" : formatarNumero(desempenho.media)}</strong>
          <span className="resumo-media-detalhe">{estado.curto}</span>
          <Selo situacao={desempenho.situacao} mapa={SITUACAO_NOTA} />
        </div>
      </div>

      {desempenho.media !== null && <QuantoFalta disciplina={disciplina} desempenho={desempenho} />}
      <p className="cartao-dica">
        Clique em Média M1 ou Média M2 para ver e lançar as notas de cada etapa.
        {desempenho.media !== null && !desempenho.final ? ` ${estado.detalhe}` : ""}
      </p>

      {avaliacoes.length === 0 ? (
        <p className="aviso-vazio">
          Nenhuma avaliação na {etapaAtual.etapa} ainda. Adicione abaixo ou pelo calendário.
        </p>
      ) : (
        <>
          <p className="cartao-dica">
            {etapaAtual.avaliacoes.comNota} de {etapaAtual.avaliacoes.total} avaliações da {etapaAtual.etapa} com nota
            {desempenho.avaliacoes.aguardandoNota > 0 &&
              ` · ${desempenho.avaliacoes.aguardandoNota} aguardando nota na disciplina`}
          </p>
          <ul className="lista-avaliacoes">
            {avaliacoes.map((avaliacao) => (
              <LinhaAvaliacao
                key={avaliacao.id}
                avaliacao={{ ...avaliacao, diasRestantes: avaliacao.diasRestantes ?? (avaliacao.data.slice(0, 10) <= hoje ? 0 : 1) }}
                outraEtapa={outraEtapa}
                aoLancar={aoLancar}
                aoRemover={aoRemover}
                aoMudarEtapa={aoMudarEtapa}
              />
            ))}
          </ul>
        </>
      )}

      {desempenho.avaliacoes.naoAvaliativos > 0 && (
        <p className="cartao-dica">
          {desempenho.avaliacoes.naoAvaliativos} evento(s) com peso 0 não entram na média.
        </p>
      )}

      <NovaAvaliacaoForm etapa={etapaAtual.etapa} aoCriar={aoCriar} />
      <ExplicacaoMedia disciplina={disciplina} desempenho={desempenho} />
    </section>
  );
}
