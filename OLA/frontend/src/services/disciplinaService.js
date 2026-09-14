import { api } from "./api";

export async function listar() {
  const { data } = await api.get("/disciplinas");
  return data;
}
export async function criar(disciplina) {
  const { data } = await api.post("/disciplinas", disciplina);
  return data;
}
