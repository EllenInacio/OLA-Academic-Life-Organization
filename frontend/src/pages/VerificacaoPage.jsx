import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Mensagem from "../components/Mensagem";
import { useAuth } from "../contexts/AuthContext";
import { mensagemDeErro } from "../services/api";

export default function VerificacaoPage() {
  const { tokenTemporario, enviarCodigoPorEmail, concluirLogin } = useAuth();

  const [metodo, setMetodo] = useState("app");
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [mensagem, setMensagem] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (!tokenTemporario) {
    return <Navigate to="/login" replace />;
  }

  function escolherMetodo(novoMetodo) {
    setMetodo(novoMetodo);
    setCodigo("");
    setMensagem(null);
  }

  async function enviarCodigo() {
    setEnviando(true);
    try {
      const resposta = await enviarCodigoPorEmail();
      setCodigoEnviado(true);
      setMensagem({ texto: resposta.mensagem, tipo: "sucesso" });
    } catch (falha) {
      setMensagem({ texto: mensagemDeErro(falha), tipo: "erro" });
    } finally {
      setEnviando(false);
    }
  }

  async function validar(evento) {
    evento.preventDefault();

    if (!/^\d{6}$/.test(codigo)) {
      setMensagem({ texto: "Digite o código de 6 dígitos.", tipo: "erro" });
      return;
    }

    setEnviando(true);
    try {
      await concluirLogin(codigo, metodo);
    } catch (falha) {
      setMensagem({ texto: mensagemDeErro(falha), tipo: "erro" });
      setEnviando(false);
    }
  }

  const aguardandoEnvio = metodo === "email" && !codigoEnviado;

  return (
    <AuthLayout
      titulo="Verificação em duas etapas"
      subtitulo="Escolha como deseja receber o código de verificação."
    >
      <div className="auth-metodos" role="group" aria-label="Método de verificação">
        <button type="button" aria-pressed={metodo === "app"} onClick={() => escolherMetodo("app")}>
          App autenticador
        </button>
        <button type="button" aria-pressed={metodo === "email"} onClick={() => escolherMetodo("email")}>
          Receber por e-mail
        </button>
      </div>

      <Mensagem texto={mensagem?.texto} tipo={mensagem?.tipo} />

      {aguardandoEnvio ? (
        <>
          <p className="auth-info">
            Enviaremos um código de 6 dígitos para o e-mail cadastrado na sua conta.
          </p>
          <button
            type="button"
            className="botao-principal auth-botao"
            onClick={enviarCodigo}
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Enviar Código"}
          </button>
        </>
      ) : (
        <form onSubmit={validar} noValidate>
          <p className="auth-info">
            {metodo === "app" ? (
              "Informe o código de 6 dígitos gerado pelo seu aplicativo autenticador."
            ) : (
              <>
                O código expira em <strong>15 minutos.</strong>
              </>
            )}
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

      <div className="auth-links">
        {metodo === "email" && codigoEnviado && (
          <span>
            Não recebeu?{" "}
            <button type="button" className="auth-link-botao" onClick={enviarCodigo} disabled={enviando}>
              Reenviar código
            </button>
          </span>
        )}
        <span>
          Voltar à tela de login? <Link to="/login">Clique Aqui</Link>
        </span>
      </div>
    </AuthLayout>
  );
}
