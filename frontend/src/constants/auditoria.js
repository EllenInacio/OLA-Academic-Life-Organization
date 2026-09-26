export const ROTULOS_ACAO = {
  CADASTRO: "Conta criada",
  LOGIN_FALHA: "Tentativa de login recusada",
  LOGIN_SENHA_VALIDA: "Senha validada",
  LOGIN_2FA_FALHA: "Código de verificação incorreto",
  LOGIN_SUCESSO: "Login realizado",
  LOGOUT: "Saída do sistema",
  RECUPERACAO_SOLICITADA: "Recuperação de senha solicitada",
  RECUPERACAO_FALHA: "Código de recuperação recusado",
  RECUPERACAO_VERIFICADA: "Código de recuperação confirmado",
  RECUPERACAO_CONCLUIDA: "Senha redefinida",
  LGPD_CONSULTA_DADOS: "Consulta aos dados pessoais",
  LGPD_EXPORTACAO: "Exportação dos dados",
  LGPD_CONSENTIMENTO_REVOGADO: "Consentimento revogado",
  LGPD_CONTA_EXCLUIDA: "Conta excluída",
  DISCIPLINA_CRIADA: "Disciplina cadastrada",
  EVENTO_CRIADO: "Evento cadastrado",
  EVENTO_ALTERADO: "Evento alterado",
  EVENTO_EXCLUIDO: "Evento excluído",
};

export function rotuloDaAcao(acao) {
  return ROTULOS_ACAO[acao] || acao;
}
