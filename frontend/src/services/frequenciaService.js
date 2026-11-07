import { api } from "./api";

export async function listar(disciplinaId) {
  const { data } = await api.get(`/disciplinas/${disciplinaId}/frequencias`);
  return data;
}
export async function criar(disciplinaId, registro) {
  const { data } = await api.post(`/disciplinas/${disciplinaId}/frequencias`, registro);
  return data;
}
export async function atualizar(id, registro) {
  const { data } = await api.put(`/frequencias/${id}`, registro);
  return data;
}
export async function remover(id) {
  await api.delete(`/frequencias/${id}`);
}
