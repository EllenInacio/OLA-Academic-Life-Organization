import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Mensagem from "../components/Mensagem";
import TermosPrivacidade from "../components/TermosPrivacidade";
import * as authService from "../services/authService";
import { mensagemDeErro } from "../services/api";

const FORMULARIO_VAZIO = { nome: "", email: "", senha: "" };

export default function CadastroPage() {
  const [campos, setCampos] = useState(FORMULARIO_VAZIO);
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [qrCode, setQrCode] = useState("");

  function alterar(campo, valor) {
    setCampos((atuais) => ({ ...atuais, [campo]: valor }));
  }

  async function enviar(evento) {
    evento.preventDefault();

    if (!campos.nome.trim() || !campos.email.trim() || !campos.senha) {
      setErro("Preencha o nome de usuário, o e-mail e a senha.");
      return;
    }
    if (campos.senha.length < 8) {
      setErro("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (!aceite) {
      setErro("Você precisa concordar com os Termos de Uso e a Política de Privacidade.");
      return;
    }

    setErro("");
    setEnviando(true);
    try {
      const resposta = await authService.cadastrar({
        nome: campos.nome.trim(),
        email: campos.email.trim(),
        senha: campos.senha,
        aceiteTermos: true,
      });
      setQrCode(resposta.qrCode);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  if (qrCode) {
    return (
      <AuthLayout
        titulo="Conta criada!"
        subtitulo="Escaneie o QR Code no seu aplicativo autenticador (Google Authenticator, Microsoft Authenticator ou similar). Se preferir, no login você também pode receber o código por e-mail."
      >
        <img className="auth-qrcode" src={qrCode} alt="QR Code para configurar o aplicativo autenticador" />
        <Link to="/login" className="botao-principal auth-botao auth-botao-link">
          Ir para o login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      titulo="Criar sua conta"
      subtitulo="Leva menos de um minuto para começar o semestre organizado."
    >
      <Mensagem texto={erro} tipo="erro" />

      <form onSubmit={enviar} noValidate>
        <div className="campo">
          <label htmlFor="cadastro-nome">Nome de Usuário</label>
          <input
            id="cadastro-nome"
            autoComplete="name"
            maxLength={120}
            value={campos.nome}
            onChange={(e) => alterar("nome", e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="cadastro-email">E-mail</label>
          <input
            id="cadastro-email"
            type="email"
            autoComplete="email"
            maxLength={160}
            value={campos.email}
            onChange={(e) => alterar("email", e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="cadastro-senha">Senha</label>
          <input
            id="cadastro-senha"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            value={campos.senha}
            onChange={(e) => alterar("senha", e.target.value)}
          />
        </div>

        <details className="auth-termos">
          <summary>Termos de Uso e Política de Privacidade</summary>
          <TermosPrivacidade />
        </details>

        <label className="auth-aceite">
          <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
          <span>
            Concordo com os Termos de Uso e a Política de Privacidade, incluindo o tratamento
            dos meus dados conforme a LGPD.
          </span>
        </label>

        <button type="submit" className="botao-principal auth-botao" disabled={enviando}>
          {enviando ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <div className="auth-links">
        <span>
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </span>
      </div>
    </AuthLayout>
  );
}
