import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333/api",
});
export function mensagemDeErro(erro) {
  return (
    erro?.response?.data?.erro ||
    "Não foi possível comunicar com o servidor. Verifique se o back-end está rodando."
  );
}
