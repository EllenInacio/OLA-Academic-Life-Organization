import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService";
import { aoSessaoExpirar, definirToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [tokenTemporario, setTokenTemporario] = useState(null);
  const [aviso, setAviso] = useState(null);

  const encerrarSessao = useCallback((novoAviso = null) => {
    definirToken(null);
    setUsuario(null);
    setAviso(novoAviso);
  }, []);

  useEffect(() => {
    aoSessaoExpirar(() =>
      encerrarSessao({
        texto: "Sua sessão expirou. Faça login novamente.",
        tipo: "erro",
      })
    );
  }, [encerrarSessao]);

  async function iniciarLogin(email, senha) {
    const dados = await authService.login(email, senha);
    setTokenTemporario(dados.tokenTemporario);
    setAviso(null);
  }

  function enviarCodigoPorEmail() {
    return authService.enviarCodigo2fa(tokenTemporario);
  }

  async function concluirLogin(codigo, metodo) {
    const dados = await authService.verificar2fa(tokenTemporario, codigo, metodo);
    definirToken(dados.token);
    setTokenTemporario(null);
    setUsuario(dados.usuario);
  }

  async function sair() {
    await authService.logout().catch(() => null);
    encerrarSessao();
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        tokenTemporario,
        aviso,
        setAviso,
        iniciarLogin,
        enviarCodigoPorEmail,
        concluirLogin,
        sair,
        encerrarSessao,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
