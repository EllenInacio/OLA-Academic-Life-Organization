import { useState } from "react";

export default function DisciplinaForm({ aoSalvar }) {
  const [nome, setNome] = useState("");
  const [professor, setProfessor] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();

    if (!nome.trim()) {
      setErro("Informe o nome da disciplina.");
      return;
    }

    setErro("");
    setSalvando(true);
    const salvou = await aoSalvar({
      nome: nome.trim(),
      professor: professor.trim(),
    });
    setSalvando(false);

    if (salvou) {
      setNome("");
      setProfessor("");
    }
  }

  return (
    <form className="cartao" onSubmit={enviar}>
      <h2>Nova disciplina</h2>

      {erro && <p className="erro-campo">{erro}</p>}

      <div className="campo">
        <label htmlFor="disciplina-nome">Nome</label>
        <input
          id="disciplina-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Cálculo I"
          maxLength={120}
        />
      </div>

      <div className="campo">
        <label htmlFor="disciplina-professor">Professor (opcional)</label>
        <input
          id="disciplina-professor"
          value={professor}
          onChange={(e) => setProfessor(e.target.value)}
          maxLength={120}
        />
      </div>

      <button type="submit" className="botao-principal" disabled={salvando}>
        {salvando ? "Salvando..." : "Cadastrar disciplina"}
      </button>
    </form>
  );
}
