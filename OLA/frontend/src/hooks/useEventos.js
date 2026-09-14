import { useEffect, useState } from "react";
import * as eventoService from "../services/eventoService";
import { mensagemDeErro } from "../services/api";

export function useEventos() {
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroEventos, setErroEventos] = useState("");

  async function recarregar() {
    setEventos(await eventoService.listar());
  }

  useEffect(() => {
    recarregar()
      .catch((erro) => setErroEventos(mensagemDeErro(erro)))
      .finally(() => setCarregando(false));
  }, []);

  async function criarEvento(dados) {
    await eventoService.criar(dados);
    await recarregar();
  }

  async function atualizarEvento(id, dados) {
    await eventoService.atualizar(id, dados);
    await recarregar();
  }

  async function removerEvento(id) {
    await eventoService.remover(id);
    await recarregar();
  }

  return {
    eventos,
    carregando,
    erroEventos,
    criarEvento,
    atualizarEvento,
    removerEvento,
  };
}
