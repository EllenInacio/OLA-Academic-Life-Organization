import { useEffect, useState } from "react";
import { TIPOS_EVENTO, STATUS_EVENTO } from "../constants/evento";

const FORMULARIO_VAZIO = {
  titulo: "",
  tipo: "PROVA",
  data: "",
  peso: "1",
  status: "PENDENTE",
  disciplinaId: "",
};

export default function EventoForm({
  disciplinas,
  eventoEmEdicao,
  aoSalvar,
  aoCancelar,
}) {
  const [campos, setCampos] = useState(FORMULARIO_VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (eventoEmEdicao) {
      setCampos({
        titulo: eventoEmEdicao.titulo,
        tipo: eventoEmEdicao.tipo,
        data: eventoEmEdicao.data.slice(0, 10),
        peso: String(Number(eventoEmEdicao.peso)),
        status: eventoEmEdicao.status,
        disciplinaId: String(eventoEmEdicao.disciplinaId),
      });
    } else {
      setCampos(FORMULARIO_VAZIO);
    }
    setErro("");
  }, [eventoEmEdicao]);

  function alterar(campo, valor) {
    setCampos((atuais) => ({ ...atuais, [campo]: valor }));
  }

  async function enviar(evento) {
    evento.preventDefault();

    if (!campos.titulo.trim()) {
      setErro("Informe o título do evento.");
      return;
    }
    if (!campos.disciplinaId) {
      setErro("Selecione uma disciplina.");
      return;
    }
    if (!campos.data) {
      setErro("Informe a data do evento.");
      return;
    }
    if (campos.peso === "" || Number(campos.peso) < 0) {
      setErro("O peso deve ser um número maior ou igual a zero.");
      return;
    }

    setErro("");
    setSalvando(true);
    const salvou = await aoSalvar({
      titulo: campos.titulo.trim(),
      tipo: campos.tipo,
      data: campos.data,
      peso: Number(campos.peso),
      status: campos.status,
      disciplinaId: Number(campos.disciplinaId),
    });
    setSalvando(false);

    if (salvou && !eventoEmEdicao) {
      setCampos(FORMULARIO_VAZIO);
    }
  }

  return (
    <form className="cartao" onSubmit={enviar}>
      <h2>{eventoEmEdicao ? "Editar evento" : "Novo evento"}</h2>

      {erro && <p className="erro-campo">{erro}</p>}

      <div className="campo">
        <label htmlFor="evento-titulo">Título</label>
        <input
          id="evento-titulo"
          value={campos.titulo}
          onChange={(e) => alterar("titulo", e.target.value)}
          placeholder="Ex.: Prova 1"
          maxLength={150}
        />
      </div>

      <div className="campo">
        <label htmlFor="evento-disciplina">Disciplina</label>
        <select
          id="evento-disciplina"
          value={campos.disciplinaId}
          onChange={(e) => alterar("disciplinaId", e.target.value)}
        >
          <option value="">Selecione...</option>
          {disciplinas.map((disciplina) => (
            <option key={disciplina.id} value={disciplina.id}>
              {disciplina.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="linha-campos">
        <div className="campo">
          <label htmlFor="evento-tipo">Tipo</label>
          <select
            id="evento-tipo"
            value={campos.tipo}
            onChange={(e) => alterar("tipo", e.target.value)}
          >
            {TIPOS_EVENTO.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.rotulo}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="evento-data">Data</label>
          <input
            id="evento-data"
            type="date"
            value={campos.data}
            onChange={(e) => alterar("data", e.target.value)}
          />
        </div>
      </div>

      <div className="linha-campos">
        <div className="campo">
          <label htmlFor="evento-peso">Peso</label>
          <input
            id="evento-peso"
            type="number"
            min="0"
            step="0.5"
            value={campos.peso}
            onChange={(e) => alterar("peso", e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="evento-status">Status</label>
          <select
            id="evento-status"
            value={campos.status}
            onChange={(e) => alterar("status", e.target.value)}
          >
            {STATUS_EVENTO.map((status) => (
              <option key={status.valor} value={status.valor}>
                {status.rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="acoes-formulario">
        <button type="submit" className="botao-principal" disabled={salvando}>
          {salvando
            ? "Salvando..."
            : eventoEmEdicao
            ? "Salvar alterações"
            : "Cadastrar evento"}
        </button>

        {eventoEmEdicao && (
          <button type="button" className="botao-secundario" onClick={aoCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
