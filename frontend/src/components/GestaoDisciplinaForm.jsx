import { forwardRef, useEffect, useState } from "react";
import { REGRAS_MEDIA } from "../constants/desempenho";
import { OPCOES_PERIODO, periodoDoValor, valorDoPeriodo } from "../constants/periodo";
import SeletorHorario from "./SeletorHorario";
import { lerNumero, plural } from "../utils/formatacao";
import { validarHorario } from "../utils/horario";
import { calcularCargaHoraria } from "../utils/cargaHoraria";

const FORMULARIO_VAZIO = {
  nome: "",
  professor: "",
  periodo: "",
  horario: "",
  inicioAulas: "",
  fimAulas: "",
  regraMedia: "PONDERADA",
  mediaAprovacao: "",
  limiteFaltas: "",
  pesoM1: "1",
  pesoM2: "2",
};

const CARGA_HORARIA_MAXIMA = 1000;
const LIMITE_FALTAS_MAXIMO = 1000;
const PESO_ETAPA_MAXIMO = 100;

function textoPeso(valor, padrao) {
  return String(Number(valor ?? padrao)).replace(".", ",");
}

function camposDe(disciplina) {
  return {
    nome: disciplina.nome,
    professor: disciplina.professor ?? "",
    periodo: valorDoPeriodo(disciplina),
    horario: disciplina.horario ?? "",
    inicioAulas: disciplina.inicioAulas ? disciplina.inicioAulas.slice(0, 10) : "",
    fimAulas: disciplina.fimAulas ? disciplina.fimAulas.slice(0, 10) : "",
    regraMedia: disciplina.regraMedia ?? "PONDERADA",
    mediaAprovacao:
      disciplina.mediaAprovacao === null || disciplina.mediaAprovacao === undefined
        ? ""
        : String(Number(disciplina.mediaAprovacao)).replace(".", ","),
    limiteFaltas:
      disciplina.limiteFaltas === null || disciplina.limiteFaltas === undefined
        ? ""
        : String(disciplina.limiteFaltas),
    pesoM1: textoPeso(disciplina.pesoM1, 1),
    pesoM2: textoPeso(disciplina.pesoM2, 2),
  };
}

function validar(campos) {
  if (!campos.nome.trim()) return "Informe o nome da disciplina.";

  const problemaHorario = validarHorario(campos.horario);
  if (problemaHorario) return problemaHorario;

  if (campos.inicioAulas && campos.fimAulas && campos.fimAulas < campos.inicioAulas) {
    return "A data final das aulas não pode ser anterior à data inicial.";
  }

  const calculo = calcularCargaHoraria(campos);
  if (calculo && calculo.horas > CARGA_HORARIA_MAXIMA) {
    return `A carga horária calculada (${calculo.horas}h) passa do limite de ${CARGA_HORARIA_MAXIMA}h. Confira os horários e as datas de início e fim das aulas.`;
  }

  if (campos.mediaAprovacao.trim() !== "") {
    const media = lerNumero(campos.mediaAprovacao);
    if (Number.isNaN(media) || media < 0 || media > 10) {
      return "A média de aprovação deve ser um número entre 0 e 10.";
    }
  }

  if (campos.limiteFaltas.trim() !== "") {
    const limite = Number(campos.limiteFaltas);
    if (!Number.isInteger(limite) || limite < 0 || limite > LIMITE_FALTAS_MAXIMO) {
      return `O limite de faltas deve ser a quantidade de faltas permitidas: um número inteiro entre 0 e ${LIMITE_FALTAS_MAXIMO}.`;
    }
  }

  for (const peso of [lerNumero(campos.pesoM1), lerNumero(campos.pesoM2)]) {
    if (Number.isNaN(peso) || peso <= 0 || peso > PESO_ETAPA_MAXIMO) {
      return `O peso da M1 e o peso da M2 devem ser números maiores que 0 e até ${PESO_ETAPA_MAXIMO}.`;
    }
  }

  return "";
}

const GestaoDisciplinaForm = forwardRef(function GestaoDisciplinaForm(
  { disciplinaEmEdicao, aoSalvar, aoCancelar },
  ref
) {
  const [campos, setCampos] = useState(FORMULARIO_VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setCampos(disciplinaEmEdicao ? camposDe(disciplinaEmEdicao) : FORMULARIO_VAZIO);
    setErro("");
  }, [disciplinaEmEdicao]);

  function alterar(campo, valor) {
    setCampos((atuais) => ({ ...atuais, [campo]: valor }));
  }

  const calculo = calcularCargaHoraria(campos);

  async function enviar(evento) {
    evento.preventDefault();

    const problema = validar(campos);
    if (problema) {
      setErro(problema);
      return;
    }

    setErro("");
    setSalvando(true);
    const salvou = await aoSalvar({
      nome: campos.nome.trim(),
      professor: campos.professor.trim(),
      ...periodoDoValor(campos.periodo),
      horario: campos.horario.trim(),
      inicioAulas: campos.inicioAulas || null,
      fimAulas: campos.fimAulas || null,
      regraMedia: campos.regraMedia,
      mediaAprovacao: campos.mediaAprovacao.trim() === "" ? null : lerNumero(campos.mediaAprovacao),
      limiteFaltas: campos.limiteFaltas.trim() === "" ? null : Number(campos.limiteFaltas),
      pesoM1: lerNumero(campos.pesoM1),
      pesoM2: lerNumero(campos.pesoM2),
    });
    setSalvando(false);

    if (salvou && !disciplinaEmEdicao) {
      setCampos(FORMULARIO_VAZIO);
    }
  }

  return (
    <form ref={ref} className="cartao gestao-form" onSubmit={enviar} noValidate>
      <h2>{disciplinaEmEdicao ? "Editar disciplina" : "Nova disciplina"}</h2>

      {erro && <p className="erro-campo">{erro}</p>}

      <div className="campo">
        <label htmlFor="gestao-nome">Nome *</label>
        <input
          id="gestao-nome"
          value={campos.nome}
          onChange={(e) => alterar("nome", e.target.value)}
          placeholder="Ex.: Cálculo I"
          maxLength={120}
          required
        />
      </div>

      <div className="campo">
        <label htmlFor="gestao-professor">Professor(a)</label>
        <input
          id="gestao-professor"
          value={campos.professor}
          onChange={(e) => alterar("professor", e.target.value)}
          maxLength={120}
        />
      </div>

      <div className="campo">
        <label htmlFor="gestao-periodo">Período acadêmico</label>
        <select id="gestao-periodo" value={campos.periodo} onChange={(e) => alterar("periodo", e.target.value)}>
          {OPCOES_PERIODO.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
      </div>

      <SeletorHorario valor={campos.horario} aoMudar={(horario) => alterar("horario", horario)} />

      <div className="linha-campos">
        <div className="campo">
          <label htmlFor="gestao-inicio-aulas">Início das aulas</label>
          <input
            id="gestao-inicio-aulas"
            type="date"
            value={campos.inicioAulas}
            max={campos.fimAulas || undefined}
            onChange={(e) => alterar("inicioAulas", e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="gestao-fim-aulas">Fim das aulas</label>
          <input
            id="gestao-fim-aulas"
            type="date"
            value={campos.fimAulas}
            min={campos.inicioAulas || undefined}
            onChange={(e) => alterar("fimAulas", e.target.value)}
          />
        </div>
      </div>
      <p className="gestao-dica">
O calendário geral só mostra as aulas dentro desse período; sem datas, elas aparecem sempre.
      </p>

      <p className="gestao-dica" aria-live="polite">
        {calculo ? (
          <>
            Carga horária calculada pelo sistema: <strong>{calculo.horas}h</strong> (
            {plural(calculo.diasDeAula, "dia de aula", "dias de aula")} no período).
          </>
        ) : (
          "A carga horária é calculada pelo sistema quando você informa os dias, os horários e as datas de início e fim das aulas."
        )}
      </p>

      <fieldset className="gestao-criterios">
        <legend>Critérios de avaliação</legend>
        <p className="gestao-dica">
          Usados no cálculo da média e da frequência. Confira as regras da sua instituição.
        </p>

        <div className="campo">
          <label htmlFor="gestao-regra">Regra da média</label>
          <select
            id="gestao-regra"
            value={campos.regraMedia}
            onChange={(e) => alterar("regraMedia", e.target.value)}
          >
            {REGRAS_MEDIA.map((regra) => (
              <option key={regra.valor} value={regra.valor}>
                {regra.rotulo}
              </option>
            ))}
          </select>
        </div>

        <div className="linha-campos">
          <div className="campo">
            <label htmlFor="gestao-media">Média para aprovação</label>
            <input
              id="gestao-media"
              inputMode="decimal"
              value={campos.mediaAprovacao}
              onChange={(e) => alterar("mediaAprovacao", e.target.value)}
              placeholder="Ex.: 6 (0 a 10)"
            />
          </div>

          <div className="campo">
            <label htmlFor="gestao-limite">Limite de faltas (qtd.)</label>
            <input
              id="gestao-limite"
              type="number"
              inputMode="numeric"
              min="0"
              max={LIMITE_FALTAS_MAXIMO}
              step="1"
              value={campos.limiteFaltas}
              onChange={(e) => alterar("limiteFaltas", e.target.value)}
              placeholder="Sem limite"
            />
          </div>
        </div>

        <div className="linha-campos">
          <div className="campo">
            <label htmlFor="gestao-peso-m1">Peso da M1</label>
            <input
              id="gestao-peso-m1"
              inputMode="decimal"
              value={campos.pesoM1}
              onChange={(e) => alterar("pesoM1", e.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor="gestao-peso-m2">Peso da M2</label>
            <input
              id="gestao-peso-m2"
              inputMode="decimal"
              value={campos.pesoM2}
              onChange={(e) => alterar("pesoM2", e.target.value)}
            />
          </div>
        </div>
        <p className="gestao-dica">
          Média final = (M1 × peso da M1 + M2 × peso da M2) ÷ soma dos pesos. O padrão é M1 com peso 1 e M2
          com peso 2. Cada avaliação é lançada na M1 ou na M2 em Notas e frequência.
        </p>
      </fieldset>

      <p className="gestao-dica">
        * Campo obrigatório. Sem média para aprovação, o OLA calcula a média mas não indica a situação. Sem
        limite de faltas, o OLA conta as faltas mas não indica a situação.
      </p>

      <div className="acoes-formulario">
        <button type="submit" className="botao-principal" disabled={salvando}>
          {salvando ? "Salvando..." : disciplinaEmEdicao ? "Salvar alterações" : "+ Cadastrar disciplina"}
        </button>

        {disciplinaEmEdicao && (
          <button type="button" className="botao-secundario" onClick={aoCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
});

export default GestaoDisciplinaForm;
