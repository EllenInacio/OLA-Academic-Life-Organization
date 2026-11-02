import { api } from "./api";

export async function listar() {
  const { data } = await api.get("/disciplinas");
  return data;
}
export async function buscar(id) {
  const { data } = await api.get(`/disciplinas/${id}`);
  return data;
}
export async function criar(disciplina) {
  const { data } = await api.post("/disciplinas", disciplina);
  return data;
}
export async function atualizar(id, disciplina) {
  const { data } = await api.put(`/disciplinas/${id}`, disciplina);
  return data;
}
export async function remover(id, confirmar = false) {
  await api.delete(`/disciplinas/${id}`, { params: confirmar ? { confirmar: true } : {} });
}
