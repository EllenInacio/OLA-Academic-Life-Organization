import { api } from "./api";

export async function cadastrar(dados) {
  const { data } = await api.post("/auth/cadastro", dados);
  return data;
}
export async function login(email, senha) {
  const { data } = await api.post("/auth/login", { email, senha });
  return data;
}
export async function enviarCodigo2fa(tokenTemporario) {
  const { data } = await api.post("/auth/2fa/enviar-codigo", { tokenTemporario });
  return data;
}
export async function verificar2fa(tokenTemporario, codigo, metodo) {
  const { data } = await api.post("/auth/2fa/verificar", {
    tokenTemporario,
    codigo,
    metodo,
  });
  return data;
}
export async function logout() {
  await api.post("/auth/logout");
}
export async function solicitarRecuperacao(email) {
  const { data } = await api.post("/auth/recuperacao/solicitar", { email });
  return data;
}
export async function verificarRecuperacao(email, codigo) {
  const { data } = await api.post("/auth/recuperacao/verificar", { email, codigo });
  return data;
}
export async function redefinirSenha(tokenRedefinicao, novaSenha) {
  const { data } = await api.post("/auth/recuperacao/redefinir", {
    tokenRedefinicao,
    novaSenha,
  });
  return data;
}
