import { api } from "./api";

export async function consultarDados() {
  const { data } = await api.get("/lgpd/dados");
  return data;
}
export async function exportar() {
  const { data } = await api.get("/lgpd/exportar");
  return data;
}
export async function listarLogs() {
  const { data } = await api.get("/lgpd/logs");
  return data.logs;
}
export async function revogarConsentimento() {
  const { data } = await api.post("/lgpd/revogar-consentimento");
  return data;
}
export async function excluirConta() {
  const { data } = await api.delete("/lgpd/conta");
  return data;
}
