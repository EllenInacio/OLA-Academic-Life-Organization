import { forwardRef, useEffect, useState } from "react";
import { REGRAS_MEDIA } from "../constants/desempenho";
import SeletorHorario from "./SeletorHorario";
import { lerNumero } from "../utils/formatacao";
import { validarHorario } from "../utils/horario";

const FORMULARIO_VAZIO = {
  nome: "",
  professor: "",
  semestre: "",
  cargaHoraria: "",
  horario: "",
  regraMedia: "PONDERADA",
  mediaAprovacao: "",
  limiteFaltas: "25",
};

const FORMATO_SEMESTRE = /^\d{4}\.[1-4]$/;
const CARGA_HORARIA_MAXIMA = 1000;

function camposDe(disciplina) {
  return {
    nome: disciplina.nome,
    professor: disciplina.professor ?? "",
    semestre: disciplina.semestre ?? "",
    cargaHoraria: disciplina.cargaHoraria ? String(disciplina.cargaHoraria) : "",
    horario: disciplina.horario ?? "",
    regraMedia: disciplina.regraMedia ?? "PONDERADA",
    mediaAprovacao:
      disciplina.mediaAprovacao === null || disciplina.mediaAprovacao === undefined
        ? ""
        : String(Number(disciplina.mediaAprovacao)).replace(".", ","),
    limiteFaltas: String(Number(disciplina.limiteFaltas ?? 25)).replace(".", ","),
  };
}

// Mesmas regras do back-end (validators/disciplinaValidator.ts), para avisar antes de enviar.
function validar(campos) {
  if (!campos.nome.trim()) return "Informe o nome da disciplina.";

  if (campos.semestre.trim() && !FORMATO_SEMESTRE.test(campos.semestre.trim())) {
    return "Informe o semestre no formato AAAA.N (ex.: 2026.2).";
  }

  if (campos.cargaHoraria !== "") {
    const carga = Number(campos.cargaHoraria);
    if (!Number.isInteger(carga) || carga < 1 || carga > CARGA_HORARIA_MAXIMA) {
      return `A carga horária deve ser um número inteiro de horas entre 1 e ${CARGA_HORARIA_MAXIMA}.`;
    }
  }

  const problemaHorario = validarHorario(campos.horario);
  if (problemaHorario) return problemaHorario;

  if (campos.mediaAprovacao.trim() !== "") {
    const media = lerNumero(campos.mediaAprovacao);
    if (Number.isNaN(media) || media < 0 || media > 10) {
      return "A média de aprovação deve ser um número entre 0 e 10.";
    }
  }

  const limite = lerNumero(campos.limiteFaltas);
  if (Number.isNaN(limite) || limite <= 0 || limite > 100) {
    return "O limite de faltas deve ser um percentual maior que 0 e até 100.";
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
      semestre: campos.semestre.trim(),
      cargaHoraria: campos.cargaHoraria === "" ? null : Number(campos.cargaHoraria),
      horario: campos.horario.trim(),
      regraMedia: campos.regraMedia,
      mediaAprovacao: campos.mediaAprovacao.trim() === "" ? null : lerNumero(campos.mediaAprovacao),
      limiteFaltas: lerNumero(campos.limiteFaltas),
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

      <div className="linha-campos">
        <div className="campo">
          <label htmlFor="gestao-semestre">Semestre</label>
          <input
            id="gestao-semestre"
            value={campos.semestre}
            onChange={(e) => alterar("semestre", e.target.value)}
            placeholder="Ex.: 2026.2"
            maxLength={10}
          />
        </div>

        <div className="campo">
          <label htmlFor="gestao-carga">Carga horária (h)</label>
          <input
            id="gestao-carga"
            type="number"
            inputMode="numeric"
            min="1"
            max={CARGA_HORARIA_MAXIMA}
            step="1"
            value={campos.cargaHoraria}
            onChange={(e) => alterar("cargaHoraria", e.target.value)}
            placeholder="Ex.: 72"
          />
        </div>
      </div>

      <SeletorHorario valor={campos.horario} aoMudar={(horario) => alterar("horario", horario)} />

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
            <label htmlFor="gestao-limite">Limite de faltas (%)</label>
            <input
              id="gestao-limite"
              inputMode="decimal"
              value={campos.limiteFaltas}
              onChange={(e) => alterar("limiteFaltas", e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <p className="gestao-dica">
        * Campo obrigatório. Sem média para aprovação, o OLA calcula a média mas não indica a situação.
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
