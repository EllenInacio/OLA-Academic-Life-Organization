import rateLimit from "express-rate-limit";

const QUINZE_MINUTOS = 15 * 60 * 1000;

function limitador(limite: number, mensagem: string, contarSucessos = true) {
  return rateLimit({
    windowMs: QUINZE_MINUTOS,
    limit: limite,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: !contarSucessos,
    skip: () => process.env.NODE_ENV === "test",
    message: { erro: mensagem },
  });
}

export const loginLimiter = limitador(
  5,
  "Muitas tentativas de login. Por segurança, aguarde 15 minutos antes de tentar novamente.",
  false
);

export const verificacao2faLimiter = limitador(
  8,
  "Muitas tentativas de verificação do código. Aguarde 15 minutos ou faça login novamente."
);

export const envioCodigo2faLimiter = limitador(
  3,
  "Limite de envios de código por e-mail atingido. Aguarde 15 minutos."
);

export const solicitacaoRecuperacaoLimiter = limitador(
  3,
  "Muitas solicitações de recuperação de senha. Aguarde 15 minutos antes de tentar novamente."
);

export const recuperacaoLimiter = limitador(
  4,
  "Muitas tentativas de recuperação de senha. Aguarde 15 minutos antes de tentar novamente.",
  false
);

export const lgpdLimiter = limitador(
  20,
  "Muitas requisições. Aguarde 15 minutos antes de tentar novamente."
);
