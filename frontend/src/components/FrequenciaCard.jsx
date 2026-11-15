import { useState } from "react";
import { Link } from "react-router-dom";
import Selo from "./Selo";
import { SITUACAO_FREQUENCIA } from "../constants/desempenho";
import { formatarData, formatarPercentual, hojeISO, plural } from "../utils/formatacao";

const MAXIMO_AULAS = 12;
const MAXIMO_FALTAS = 1000;

function faltasValidas(valor) {
  return Number.isInteger(valor) && valor >= 0 && valor <= MAXIMO_FALTAS;
}

export function textoFaltasEmAulas(frequencia) {
  const faltas = plural(frequencia.faltas, "falta", "faltas");
  return frequencia.base === "TOTAL_DA_DISCIPLINA"
    ? `${faltas} em ${plural(frequencia.totalAulas, "aula da disciplina", "aulas da disciplina")}`
    : `${faltas} em ${plural(frequencia.aulasRegistradas, "aula registrada", "aulas registradas")}`;
}

export function usoDoLimite(frequencia) {
  if (frequencia.faltasPermitidas === null) return 0;
  if (frequencia.faltasPermitidas === 0) return frequencia.faltas > 0 ? 100 : 0;
  return Math.min(100, (frequencia.faltas / frequencia.faltasPermitidas) * 100);
}

export function textoLimite(frequencia) {
  return frequencia.limiteFaltas === null
    ? "Limite de faltas não definido"
    : `Limite de reprovação: ${plural(frequencia.limiteFaltas, "falta", "faltas")}`;
}

export function BarraFrequencia({ frequencia }) {
  if (frequencia.faltasPermitidas === null) return null;

  const uso = usoDoLimite(frequencia);
  const descricao = `${frequencia.faltas} de ${frequencia.faltasPermitidas} faltas permitidas`;

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
    if (!faltasValidas(quantidadeFaltas)) {
      return setErro("As faltas devem ser um número inteiro, de 0 em diante (sem números negativos ou quebrados).");
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
        Um registro por dia de aula. Conte as faltas na mesma unidade do total de aulas da disciplina
        (horas-aula): se você perdeu 4 aulas no mesmo dia, informe 4 faltas. Use 0 se esteve presente.
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
    if (!faltasValidas(faltas)) {
      return setErro("Faltas: número inteiro, de 0 em diante.");
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
            step="1"
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
        Cadastre o limite de faltas da disciplina para saber quantas faltas ainda são permitidas no semestre.{" "}
        <Link to={`/disciplinas?editar=${disciplina.id}`}>Informar limite de faltas</Link>
      </p>
    );
  }

  const base = `O limite cadastrado para a disciplina é de ${plural(frequencia.faltasPermitidas, "falta", "faltas")}`;

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
          <p>{textoLimite(frequencia)}</p>
        </div>
        <div className="destaque-numero">
          <span>{frequencia.base === "TOTAL_DA_DISCIPLINA" ? "Frequência" : "Frequência (parcial)"}</span>
          <strong>
            {frequencia.percentualPresenca === null ? "—" : formatarPercentual(frequencia.percentualPresenca)}
          </strong>
          <Selo situacao={frequencia.situacao} mapa={SITUACAO_FREQUENCIA} />
        </div>
      </header>

      <p className="cartao-dica">
        {frequencia.aulasPrevistas !== null ? (
          <>
            Total de aulas da disciplina: <strong>{frequencia.aulasPrevistas}</strong> (carga horária calculada
            pelos dias, horários e datas das aulas).{" "}
            <Link to={`/disciplinas?editar=${disciplina.id}`}>Alterar dias e horários</Link>
          </>
        ) : (
          <>
            Informe os dias, os horários e as datas das aulas no cadastro da disciplina: o sistema calcula o total
            de aulas e a frequência do período todo. Sem isso, o percentual é parcial e usa só as aulas
            registradas.{" "}
            <Link to={`/disciplinas?editar=${disciplina.id}`}>Informar dias e horários</Link>
          </>
        )}
      </p>

      {frequencia.aulasRegistradas === 0 ? (
        <p className="aviso-vazio">Nenhuma aula registrada ainda. O percentual aparece depois do primeiro registro.</p>
      ) : (
        <>
          <BarraFrequencia frequencia={frequencia} />
          <p className="cartao-dica">
            {textoFaltasEmAulas(frequencia)} = {formatarPercentual(frequencia.percentualFaltas)} de faltas
            {frequencia.faltasPermitidas !== null &&
              ` · ${frequencia.faltas} de ${frequencia.faltasPermitidas} faltas permitidas`}
          </p>
          {frequencia.faltasAcimaDoTotal && (
            <p className="texto-critico">
              Inconsistência: as faltas registradas ({frequencia.faltas}) passam do total de aulas (
              {frequencia.totalAulas}). O registro foi mantido e a frequência aparece como 0%. Confira os dias,
              horários e datas das aulas da disciplina ou os registros de faltas.
            </p>
          )}
          {frequencia.ritmoAcimaDoLimite && frequencia.situacao !== "ACIMA_DO_LIMITE" && (
            <p className="texto-atencao">
              No ritmo atual ({frequencia.faltas} faltas em {frequencia.aulasRegistradas} aulas registradas), você
              passaria do limite de {plural(frequencia.faltasPermitidas, "falta", "faltas")} até o fim do semestre. É
              uma estimativa.
            </p>
          )}
          {frequencia.registrosAcimaDoPrevisto && (
            <p className="texto-atencao">
              Há mais aulas registradas ({frequencia.aulasRegistradas}) do que a carga horária prevê (
              {frequencia.aulasPrevistas}). Confira os dias, horários e datas das aulas ou os registros.
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
