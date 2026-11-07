import { api } from "./api";

export async function lancar(eventoId, nota, notaMaxima) {
  const corpo = notaMaxima === undefined ? { nota } : { nota, notaMaxima };
  const { data } = await api.put(`/eventos/${eventoId}/nota`, corpo);
  return data;
}
export async function remover(eventoId) {
  const { data } = await api.delete(`/eventos/${eventoId}/nota`);
  return data;
}
