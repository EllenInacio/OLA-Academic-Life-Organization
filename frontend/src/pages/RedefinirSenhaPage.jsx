import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Mensagem from "../components/Mensagem";
import { useAuth } from "../contexts/AuthContext";
import * as authService from "../services/authService";
import { mensagemDeErro } from "../services/api";

const ETAPAS = {
  1: {
    titulo: "Redefinir Senha",
    subtitulo: "Informe seu e-mail e encaminharemos um código de validação.",
  },
  2: {
    titulo: "Verifique seu e-mail",
    subtitulo: "Enviamos um código de 6 dígitos para o e-mail cadastrado na sua conta.",
  },
  3: {
    titulo: "Redefinir Senha",
    subtitulo: "Escolha uma nova senha segura para sua conta.",
  },
};

export default function RedefinirSenhaPage() {
  const { setAviso } = useAuth();
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [tokenRedefinicao, setTokenRedefinicao] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function executar(acao) {
    setErro("");
    setEnviando(true);
    try {
      await acao();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  function enviarCodigo(evento) {
    evento.preventDefault();
    if (!email.trim()) {
      setErro("Informe o e-mail cadastrado.");
      return;
    }
    executar(async () => {
      await authService.solicitarRecuperacao(email.trim());
      setEtapa(2);
    });
  }

  function validarCodigo(evento) {
    evento.preventDefault();
    if (!/^\d{6}$/.test(codigo)) {
      setErro("Digite o código de 6 dígitos.");
      return;
    }
    executar(async () => {
      const resposta = await authService.verificarRecuperacao(email.trim(), codigo);
      setTokenRedefinicao(resposta.tokenRedefinicao);
      setEtapa(3);
    });
  }

  function salvarSenha(evento) {
    evento.preventDefault();
    if (novaSenha.length < 8) {
      setErro("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }
    executar(async () => {
      const resposta = await authService.redefinirSenha(tokenRedefinicao, novaSenha);
      setAviso({ texto: resposta.mensagem, tipo: "sucesso" });
      navigate("/login");
    });
  }

  return (
    <AuthLayout titulo={ETAPAS[etapa].titulo} subtitulo={ETAPAS[etapa].subtitulo}>
      <Mensagem texto={erro} tipo="erro" />

      {etapa === 1 && (
        <form onSubmit={enviarCodigo} noValidate>
          <div className="campo">
            <label htmlFor="recuperacao-email">E-mail</label>
            <input
              id="recuperacao-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="botao-principal auth-botao" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar Código"}
          </button>
        </form>
      )}

      {etapa === 2 && (
        <form onSubmit={validarCodigo} noValidate>
          <p className="auth-info">
            O código expira em <strong>15 minutos.</strong>
          </p>
          <div className="campo auth-campo-codigo">
            <input
              aria-label="Código de 6 dígitos"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <button type="submit" className="botao-principal auth-botao" disabled={enviando}>
            {enviando ? "Validando..." : "Validar Código"}
          </button>
        </form>
      )}

      {etapa === 3 && (
        <form onSubmit={salvarSenha} noValidate>
          <div className="campo">
            <label htmlFor="recuperacao-senha">Nova Senha</label>
            <input
              id="recuperacao-senha"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="recuperacao-confirmacao">Confirmar Nova Senha</label>
            <input
              id="recuperacao-confirmacao"
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </div>
          <button type="submit" className="botao-principal auth-botao" disabled={enviando}>
            {enviando ? "Salvando..." : "Salvar Nova Senha"}
          </button>
        </form>
      )}

      <div className="auth-links">
        <span>
          Voltar à tela de login? <Link to="/login">Clique Aqui</Link>
        </span>
      </div>
    </AuthLayout>
  );
}
