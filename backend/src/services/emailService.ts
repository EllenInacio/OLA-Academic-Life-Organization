import nodemailer from "nodemailer";
import { VALIDADE_CODIGO_MINUTOS } from "../utils/codigo";

const remetente = process.env.GMAIL_USER;
const senhaDeApp = process.env.GMAIL_APP_PASSWORD;

const transporter =
  remetente && senhaDeApp
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: remetente, pass: senhaDeApp },
      })
    : null;

function escaparHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function modelo(titulo: string, conteudo: string, rodape: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #17161a;">
      <div style="background: #5b3fb0; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">${titulo}</h2>
      </div>
      <div style="background: #faf9fd; padding: 28px; border-radius: 0 0 8px 8px; border: 1px solid #e5e1ee;">
        ${conteudo}
        <hr style="border: none; border-top: 1px solid #e5e1ee; margin: 20px 0;">
        <p style="font-size: 12px; color: #6d6a75; text-align: center;">${rodape}</p>
      </div>
    </div>`;
}

function blocoCodigo(codigo: string) {
  return `
    <div style="text-align: center; margin: 28px 0;">
      <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 10px;
        background: #ffffff; border: 2px dashed #7c5cd6; border-radius: 8px; padding: 16px 28px; color: #5b3fb0;">
        ${codigo}
      </span>
    </div>
    <p style="text-align: center; color: #b3261e; font-size: 13px;">
      Este código expira em <strong>${VALIDADE_CODIGO_MINUTOS} minutos</strong>.
    </p>`;
}

async function enviar(
  para: string,
  assunto: string,
  html: string,
  resumo: string
) {
  if (process.env.NODE_ENV === "test") return;

  if (!transporter) {
    const mensagem = "[e-mail] GMAIL_USER e GMAIL_APP_PASSWORD não configurados.";

    if (process.env.NODE_ENV === "production") {
      console.error(mensagem);
      throw new Error(mensagem);
    }

    console.log(`[e-mail simulado] Para: ${para} | ${assunto} | ${resumo}`);
    return;
  }

  try {
    const resultado = await transporter.sendMail({
      from: `"OLA" <${remetente}>`,
      to: para,
      subject: assunto,
      html,
    });

    console.log(
      `[e-mail] Enviado com sucesso para ${para}. Message ID: ${resultado.messageId}`
    );

    return resultado;
  } catch (erro) {
    console.error(
      `[e-mail] Falha ao enviar "${assunto}" para ${para}:`,
      erro
    );

    throw new Error("Não foi possível enviar o e-mail.");
  }
}

export function enviarBoasVindas(para: string, nome: string) {
  return enviar(
    para,
    "Bem-vindo(a) ao OLA",
    modelo(
      `Bem-vindo(a), ${escaparHtml(nome)}!`,
      `<p>Sua conta no OLA foi criada com sucesso.</p>
       <p>A cada login, confirme o acesso com o código do seu aplicativo autenticador
       ou com um código enviado para este e-mail.</p>`,
      "Se você não criou esta conta, ignore este e-mail."
    ),
    "conta criada"
  );
}

export function enviarCodigo2fa(para: string, nome: string, codigo: string) {
  return enviar(
    para,
    "Seu código de verificação do OLA",
    modelo(
      "Código de Verificação",
      `<p>Olá, <strong>${escaparHtml(nome)}</strong>. Use o código abaixo para concluir seu login:</p>
       ${blocoCodigo(codigo)}`,
      "Se você não tentou fazer login, ignore este e-mail e considere trocar sua senha."
    ),
    `código de verificação: ${codigo}`
  );
}

export function enviarCodigoRecuperacao(para: string, nome: string, codigo: string) {
  return enviar(
    para,
    "Código para redefinir sua senha do OLA",
    modelo(
      "Redefinição de Senha",
      `<p>Olá, <strong>${escaparHtml(nome)}</strong>. Use o código abaixo para redefinir sua senha:</p>
       ${blocoCodigo(codigo)}`,
      "Se você não solicitou isso, ignore este e-mail. Sua senha permanece a mesma."
    ),
    `código de recuperação: ${codigo}`
  );
}
