import { useEffect, useState } from "react";
import * as disciplinaService from "../services/disciplinaService";
import { mensagemDeErro } from "../services/api";

export function useDisciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [erroDisciplinas, setErroDisciplinas] = useState("");

  async function recarregar() {
    setDisciplinas(await disciplinaService.listar());
  }

  useEffect(() => {
    recarregar().catch((erro) => setErroDisciplinas(mensagemDeErro(erro)));
  }, []);

  async function criarDisciplina(dados) {
    await disciplinaService.criar(dados);
    await recarregar();
  }

  return { disciplinas, erroDisciplinas, criarDisciplina };
}
