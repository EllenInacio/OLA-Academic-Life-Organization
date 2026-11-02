import { forwardRef, useEffect, useState } from "react";

const FORMULARIO_VAZIO = {
  nome: "",
  professor: "",
  semestre: "",
  cargaHoraria: "",
  horario: "",
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
  };
}

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

      <div className="campo">
        <label htmlFor="gestao-horario">Horário</label>
        <input
          id="gestao-horario"
          value={campos.horario}
          onChange={(e) => alterar("horario", e.target.value)}
          placeholder="Ex.: Seg e Qua · 08:00–09:40"
          maxLength={120}
        />
      </div>

      <p className="gestao-dica">* Campo obrigatório. Os demais podem ser preenchidos depois.</p>

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
