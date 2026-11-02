import { useEffect, useState } from "react";
import * as disciplinaService from "../services/disciplinaService";
import { mensagemDeErro } from "../services/api";

export function useDisciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroDisciplinas, setErroDisciplinas] = useState("");

  async function recarregar() {
    setDisciplinas(await disciplinaService.listar());
  }

  useEffect(() => {
    recarregar()
      .catch((erro) => setErroDisciplinas(mensagemDeErro(erro)))
      .finally(() => setCarregando(false));
  }, []);

  async function criarDisciplina(dados) {
    const criada = await disciplinaService.criar(dados);
    await recarregar();
    return criada;
  }

  async function atualizarDisciplina(id, dados) {
    const atualizada = await disciplinaService.atualizar(id, dados);
    await recarregar();
    return atualizada;
  }

  async function removerDisciplina(id, confirmar = false) {
    await disciplinaService.remover(id, confirmar);
    await recarregar();
  }

  return {
    disciplinas,
    carregando,
    erroDisciplinas,
    criarDisciplina,
    atualizarDisciplina,
    removerDisciplina,
  };
}
