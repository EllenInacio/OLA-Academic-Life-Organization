import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Selo from "./Selo";
import { TIPOS_EVENTO, rotuloDe } from "../constants/evento";
import { SITUACAO_NOTA, rotuloRegra } from "../constants/desempenho";
import { formatarData, formatarNumero, hojeISO, lerNumero } from "../utils/formatacao";

const NOVA_AVALIACAO = { titulo: "", tipo: "PROVA", data: "", peso: "1", nota: "", notaMaxima: "10" };

function textoNota(nota) {
  return nota === null || nota === undefined ? "" : formatarNumero(Number(nota), 2);
}

function LinhaAvaliacao({ avaliacao, aoLancar, aoRemover }) {
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

function NovaAvaliacaoForm({ aoCriar }) {
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
      <h3>Nova avaliação</h3>
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
        <p className="cartao-dica">A avaliação também aparece no calendário.</p>
        <button type="submit" className="botao-principal" disabled={salvando}>
          {salvando ? "Salvando..." : "Adicionar avaliação"}
        </button>
      </div>
    </form>
  );
}

function ExplicacaoMedia({ disciplina, desempenho }) {
  const linkCriterios = (
    <Link to={`/disciplinas?editar=${disciplina.id}`}>
      {desempenho.mediaAprovacao === null ? "Definir média de aprovação" : "Alterar critérios"}
    </Link>
  );

  const formula =
    desempenho.regraMedia === "PONDERADA"
      ? "Σ(nota × peso) ÷ Σ(pesos)"
      : "soma das notas ÷ quantidade de avaliações";

  const { notaNecessaria } = desempenho;

  return (
    <div className="explicacao-calculo">
      <p>
        <strong>Como a média é calculada:</strong> {rotuloRegra(desempenho.regraMedia, true).toLowerCase()} ={" "}
        {formula}, considerando só as avaliações com nota lançada. Notas em outra escala são convertidas
        para 0–10 pela nota máxima. Eventos com peso 0 não entram na média.
      </p>

      {desempenho.mediaAprovacao === null ? (
        <p>A situação aparece depois que você definir a média de aprovação da disciplina. {linkCriterios}</p>
      ) : (
        <>
          <p>
            Média para aprovação: <strong>{formatarNumero(desempenho.mediaAprovacao)}</strong>. {linkCriterios}
          </p>
          {notaNecessaria && notaNecessaria.alcancavel && notaNecessaria.valor === 0 && (
            <p>Com as notas lançadas, a média de aprovação já está garantida.</p>
          )}
          {notaNecessaria && notaNecessaria.alcancavel && notaNecessaria.valor > 0 && (
            <p>
              Para chegar à média, você precisa de média <strong>{formatarNumero(notaNecessaria.valor)}</strong> nas
              avaliações que ainda estão sem nota.
            </p>
          )}
          {notaNecessaria && !notaNecessaria.alcancavel && (
            <p className="texto-critico">
              Mesmo tirando 10 em todas as avaliações restantes, a média não chega a{" "}
              {formatarNumero(desempenho.mediaAprovacao)} com as avaliações cadastradas.
            </p>
          )}
        </>
      )}
      <p className="cartao-dica">Resultado calculado a partir das notas que você lançou; não substitui o boletim oficial.</p>
    </div>
  );
}

export default function NotasCard({ disciplina, aoLancar, aoRemover, aoCriar }) {
  const { desempenho } = disciplina.resumo;
  const avaliacoes = disciplina.eventos.filter((evento) => Number(evento.peso) > 0);
  const hoje = hojeISO();

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
        <div className="destaque-numero">
          <span>
            {rotuloRegra(desempenho.regraMedia, true)}
            {desempenho.media !== null && !desempenho.final ? " (parcial)" : ""}
          </span>
          <strong>{desempenho.media === null ? "—" : formatarNumero(desempenho.media)}</strong>
          <Selo situacao={desempenho.situacao} mapa={SITUACAO_NOTA} />
        </div>
      </header>

      {avaliacoes.length === 0 ? (
        <p className="aviso-vazio">
          Nenhuma avaliação cadastrada para esta disciplina. Adicione abaixo ou pelo calendário.
        </p>
      ) : (
        <>
          <p className="cartao-dica">
            {desempenho.avaliacoes.comNota} de {desempenho.avaliacoes.total} avaliações com nota
            {desempenho.avaliacoes.aguardandoNota > 0 && ` · ${desempenho.avaliacoes.aguardandoNota} aguardando nota`}
          </p>
          <ul className="lista-avaliacoes">
            {avaliacoes.map((avaliacao) => (
              <LinhaAvaliacao
                key={avaliacao.id}
                avaliacao={{ ...avaliacao, diasRestantes: avaliacao.diasRestantes ?? (avaliacao.data.slice(0, 10) <= hoje ? 0 : 1) }}
                aoLancar={aoLancar}
                aoRemover={aoRemover}
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

      <NovaAvaliacaoForm aoCriar={aoCriar} />
      <ExplicacaoMedia disciplina={disciplina} desempenho={desempenho} />
    </section>
  );
}
