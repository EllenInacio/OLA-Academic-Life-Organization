import axios from "axios";

let tokenDeAcesso = null;
let aoExpirar = null;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333/api",
});

api.interceptors.request.use((config) => {
  if (tokenDeAcesso) {
    config.headers.Authorization = `Bearer ${tokenDeAcesso}`;
  }
  return config;
});

api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro?.response?.status === 401 && tokenDeAcesso && aoExpirar) {
      aoExpirar();
    }
    return Promise.reject(erro);
  }
);

export function definirToken(token) {
  tokenDeAcesso = token;
}

export function aoSessaoExpirar(callback) {
  aoExpirar = callback;
}
export function mensagemDeErro(erro) {
  return (
    erro?.response?.data?.erro ||
    "Não foi possível comunicar com o servidor. Verifique se o back-end está rodando."
  );
}
