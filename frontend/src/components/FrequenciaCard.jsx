import { useState } from "react";
import { Link } from "react-router-dom";
import Selo from "./Selo";
import { SITUACAO_FREQUENCIA } from "../constants/desempenho";
import { formatarData, formatarPercentual, hojeISO, plural } from "../utils/formatacao";

const MAXIMO_AULAS = 12;

/** Quanto do limite de faltas já foi usado (0 a 100), para a barra. */
export function usoDoLimite(frequencia) {
  if (frequencia.faltasPermitidas !== null) {
    if (frequencia.faltasPermitidas === 0) return frequencia.faltas > 0 ? 100 : 0;
    return Math.min(100, (frequencia.faltas / frequencia.faltasPermitidas) * 100);
  }
  if (frequencia.percentualFaltas === null) return 0;
  return Math.min(100, (frequencia.percentualFaltas / frequencia.limiteFaltas) * 100);
}

export function BarraFrequencia({ frequencia }) {
  const uso = usoDoLimite(frequencia);
  const descricao =
    frequencia.faltasPermitidas !== null
      ? `${frequencia.faltas} de ${frequencia.faltasPermitidas} faltas permitidas`
      : `${formatarPercentual(frequencia.percentualFaltas ?? 0)} de faltas; limite de ${formatarPercentual(frequencia.limiteFaltas)}`;

  return (
    <div
      className="barra-frequencia"
      role="img"
      aria-label={`Uso do limite de faltas: ${descricao}`}
      title={descricao}
    >
      <span
        className={`barra-frequencia-uso barra-${SITUACAO_FREQUENCIA[frequencia.situacao]?.classe ?? "neutra"}`}
        style={{ width: `${uso}%` }}
      />
    </div>
  );
}

function RegistrarAula({ aoRegistrar }) {
  const [data, setData] = useState(hojeISO());
  const [aulas, setAulas] = useState("1");
  const [faltas, setFaltas] = useState("0");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function registrar() {
    const quantidadeAulas = Number(aulas);
    const quantidadeFaltas = Number(faltas);

    if (!data) return setErro("Informe a data da aula.");
    if (data > hojeISO()) return setErro("Só é possível registrar aulas que já aconteceram.");
    if (!Number.isInteger(quantidadeAulas) || quantidadeAulas < 1 || quantidadeAulas > MAXIMO_AULAS) {
      return setErro(`A quantidade de aulas deve ser um número inteiro entre 1 e ${MAXIMO_AULAS}.`);
    }
    if (!Number.isInteger(quantidadeFaltas) || quantidadeFaltas < 0 || quantidadeFaltas > quantidadeAulas) {
      return setErro("As faltas devem ser um número inteiro de 0 até a quantidade de aulas do dia.");
    }

    setErro("");
    setSalvando(true);
    await aoRegistrar({ data, quantidadeAulas, faltas: quantidadeFaltas });
    setFaltas("0");
    setSalvando(false);
  }

  return (
    <div className="registrar-aula">
      <h3>Registrar aula</h3>
      {erro && <p className="erro-campo">{erro}</p>}
      <div className="registrar-aula-campos">
        <div className="campo">
          <label htmlFor="freq-data">Data da aula</label>
          <input id="freq-data" type="date" max={hojeISO()} value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="campo campo-curto">
          <label htmlFor="freq-aulas">Aulas no dia</label>
          <input
            id="freq-aulas"
            type="number"
            min="1"
            max={MAXIMO_AULAS}
            step="1"
            value={aulas}
            onChange={(e) => setAulas(e.target.value)}
          />
        </div>
        <div className="campo campo-curto">
          <label htmlFor="freq-faltas">Faltas no dia</label>
          <input
            id="freq-faltas"
            type="number"
            min="0"
            max={aulas || MAXIMO_AULAS}
            step="1"
            value={faltas}
            onChange={(e) => setFaltas(e.target.value)}
          />
        </div>
      </div>
      <div className="registrar-aula-botoes">
        <button type="button" className="botao-principal" disabled={salvando} onClick={registrar}>
          Registrar aula
        </button>
      </div>
      <p className="cartao-dica">
        Um registro por dia de aula. Informe quantas aulas houve e em quantas você faltou (0 se esteve presente).
        Ex.: 4 aulas no dia e falta só no segundo período = 2 faltas.
      </p>
    </div>
  );
}

function LinhaHistorico({ registro, aoSalvar, aoExcluir }) {
  const [editando, setEditando] = useState(false);
  const [campos, setCampos] = useState(null);
  const [erro, setErro] = useState("");

  function iniciar() {
    setCampos({
      data: registro.data.slice(0, 10),
      quantidadeAulas: String(registro.quantidadeAulas),
      faltas: String(registro.faltas),
    });
    setErro("");
    setEditando(true);
  }

  async function salvar() {
    const quantidadeAulas = Number(campos.quantidadeAulas);
    const faltas = Number(campos.faltas);

    if (!campos.data || campos.data > hojeISO()) return setErro("Informe uma data que já passou.");
    if (!Number.isInteger(quantidadeAulas) || quantidadeAulas < 1 || quantidadeAulas > MAXIMO_AULAS) {
      return setErro(`Aulas: inteiro entre 1 e ${MAXIMO_AULAS}.`);
    }
    if (!Number.isInteger(faltas) || faltas < 0 || faltas > quantidadeAulas) {
      return setErro("Faltas: de 0 até a quantidade de aulas.");
    }

    const salvou = await aoSalvar(registro, { data: campos.data, quantidadeAulas, faltas });
    if (salvou) setEditando(false);
  }

  if (editando) {
    return (
      <tr className="historico-edicao">
        <td>
          <input
            type="date"
            aria-label="Data"
            max={hojeISO()}
            value={campos.data}
            onChange={(e) => setCampos({ ...campos, data: e.target.value })}
          />
        </td>
        <td>
          <input
            type="number"
            aria-label="Aulas"
            min="1"
            max={MAXIMO_AULAS}
            value={campos.quantidadeAulas}
            onChange={(e) => setCampos({ ...campos, quantidadeAulas: e.target.value })}
          />
        </td>
        <td>
          <input
            type="number"
            aria-label="Faltas"
            min="0"
            max={campos.quantidadeAulas}
            value={campos.faltas}
            onChange={(e) => setCampos({ ...campos, faltas: e.target.value })}
          />
          {erro && <span className="erro-campo historico-erro">{erro}</span>}
        </td>
        <td className="historico-acoes">
          <button type="button" className="botao-principal botao-pequeno" onClick={salvar}>
            Salvar
          </button>
          <button type="button" className="botao-secundario botao-pequeno" onClick={() => setEditando(false)}>
            Cancelar
          </button>
        </td>
      </tr>
    );
  }

  const presente = registro.faltas === 0;
  return (
    <tr>
      <td>{formatarData(registro.data)}</td>
      <td>{registro.quantidadeAulas}</td>
      <td>
        <span className={`selo ${presente ? "selo-boa" : "selo-critica"}`}>
          {presente ? "Presente" : plural(registro.faltas, "falta", "faltas")}
        </span>
      </td>
      <td className="historico-acoes">
        <button type="button" className="botao-secundario botao-pequeno" onClick={iniciar}>
          Editar
        </button>
        <button type="button" className="botao-perigo botao-pequeno" onClick={() => aoExcluir(registro)}>
          Excluir
        </button>
      </td>
    </tr>
  );
}

function QuantoPodeFaltar({ disciplina, frequencia }) {
  if (frequencia.faltasPermitidas === null) {
    return (
      <p>
        Cadastre a carga horária da disciplina para saber quantas faltas ainda são permitidas no semestre.{" "}
        <Link to={`/disciplinas?editar=${disciplina.id}`}>Informar carga horária</Link>
      </p>
    );
  }

  const base = `Considerando ${disciplina.cargaHoraria}h de carga horária (${frequencia.aulasPrevistas} aulas, 1 por hora), o limite de ${formatarPercentual(frequencia.limiteFaltas)} permite ${plural(frequencia.faltasPermitidas, "falta", "faltas")}`;

  if (frequencia.faltasRestantes < 0) {
    return (
      <p className="texto-critico">
        {base}. Você já passou do limite em {plural(Math.abs(frequencia.faltasRestantes), "falta", "faltas")}.
      </p>
    );
  }

  return (
    <p>
      {base}: restam <strong>{plural(frequencia.faltasRestantes, "falta", "faltas")}</strong> antes de reprovar
      por frequência.
    </p>
  );
}

export default function FrequenciaCard({ disciplina, registros, aoRegistrar, aoAtualizar, aoExcluir }) {
  const { frequencia } = disciplina.resumo;

  return (
    <section className="cartao-academico" aria-labelledby="titulo-frequencia">
      <header className="cartao-academico-topo">
        <div>
          <h2 id="titulo-frequencia">Frequência</h2>
          <p>Limite de reprovação: {formatarPercentual(frequencia.limiteFaltas)} de faltas</p>
        </div>
        <div className="destaque-numero">
          <span>Faltas (parcial)</span>
          <strong>{frequencia.percentualFaltas === null ? "—" : formatarPercentual(frequencia.percentualFaltas)}</strong>
          <Selo situacao={frequencia.situacao} mapa={SITUACAO_FREQUENCIA} />
        </div>
      </header>

      {frequencia.aulasRegistradas === 0 ? (
        <p className="aviso-vazio">Nenhuma aula registrada ainda. O percentual aparece depois do primeiro registro.</p>
      ) : (
        <>
          <BarraFrequencia frequencia={frequencia} />
          <p className="cartao-dica">
            {plural(frequencia.faltas, "falta", "faltas")} em {plural(frequencia.aulasRegistradas, "aula registrada", "aulas registradas")}
            {frequencia.faltasPermitidas !== null &&
              ` · ${frequencia.faltas} de ${frequencia.faltasPermitidas} faltas permitidas`}
          </p>
          {frequencia.ritmoAcimaDoLimite && frequencia.situacao !== "ACIMA_DO_LIMITE" && (
            <p className="texto-atencao">
              No ritmo atual ({formatarPercentual(frequencia.percentualFaltas)} das aulas registradas), você passaria do
              limite de {formatarPercentual(frequencia.limiteFaltas)} até o fim do semestre. É uma estimativa.
            </p>
          )}
          {frequencia.registrosAcimaDoPrevisto && (
            <p className="texto-atencao">
              Há mais aulas registradas ({frequencia.aulasRegistradas}) do que a carga horária prevê (
              {frequencia.aulasPrevistas}). Confira a carga horária ou os registros.
            </p>
          )}
        </>
      )}

      <RegistrarAula aoRegistrar={aoRegistrar} />

      <div className="quanto-pode-faltar">
        <h3>Quanto você ainda pode faltar</h3>
        <QuantoPodeFaltar disciplina={disciplina} frequencia={frequencia} />
      </div>

      {registros.length > 0 && (
        <details className="historico">
          <summary>Histórico de aulas ({registros.length})</summary>
          <div className="historico-tabela">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Aulas</th>
                  <th>Situação</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => (
                  <LinhaHistorico key={registro.id} registro={registro} aoSalvar={aoAtualizar} aoExcluir={aoExcluir} />
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <p className="cartao-dica">
        O cálculo usa apenas os registros feitos por você e não substitui o diário oficial da instituição.
      </p>
    </section>
  );
}
