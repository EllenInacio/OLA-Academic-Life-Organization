import { api } from "./api";

export async function listar() {
  const { data } = await api.get("/eventos");
  return data;
}
export async function criar(evento) {
  const { data } = await api.post("/eventos", evento);
  return data;
}
export async function atualizar(id, evento) {
  const { data } = await api.put(`/eventos/${id}`, evento);
  return data;
}
export async function remover(id) {
  await api.delete(`/eventos/${id}`);
}
