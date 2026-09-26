import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Mensagem from "../components/Mensagem";
import { useAuth } from "../contexts/AuthContext";
import { mensagemDeErro } from "../services/api";

export default function LoginPage() {
  const { iniciarLogin, aviso, setAviso } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();

    if (!email.trim() || !senha) {
      setErro("Informe o e-mail e a senha.");
      return;
    }

    setErro("");
    setEnviando(true);
    try {
      await iniciarLogin(email.trim(), senha);
      navigate("/verificacao");
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Entrar na sua conta"
      subtitulo="Use seu e-mail acadêmico para acessar o painel"
    >
      <Mensagem texto={aviso?.texto} tipo={aviso?.tipo} aoFechar={() => setAviso(null)} />
      <Mensagem texto={erro} tipo="erro" />

      <form onSubmit={enviar} noValidate>
        <div className="campo">
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="login-senha">Senha</label>
          <input
            id="login-senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        <button type="submit" className="botao-principal auth-botao" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="auth-links">
        <span>
          Esqueceu a senha? <Link to="/redefinir-senha">Clique Aqui</Link>
        </span>
        <span>
          Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
        </span>
      </div>
    </AuthLayout>
  );
}
