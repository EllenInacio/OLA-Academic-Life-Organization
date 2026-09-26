export type AcaoAuditoria =
  | "CADASTRO"
  | "LOGIN_FALHA"
  | "LOGIN_SENHA_VALIDA"
  | "LOGIN_2FA_FALHA"
  | "LOGIN_SUCESSO"
  | "LOGOUT"
  | "RECUPERACAO_SOLICITADA"
  | "RECUPERACAO_FALHA"
  | "RECUPERACAO_VERIFICADA"
  | "RECUPERACAO_CONCLUIDA"
  | "LGPD_CONSULTA_DADOS"
  | "LGPD_EXPORTACAO"
  | "LGPD_CONSENTIMENTO_REVOGADO"
  | "LGPD_CONTA_EXCLUIDA"
  | "DISCIPLINA_CRIADA"
  | "EVENTO_CRIADO"
  | "EVENTO_ALTERADO"
  | "EVENTO_EXCLUIDO";

export type DadosAuditoria = {
  usuarioId?: number | null;
  entidade?: string;
  entidadeId?: number;
  detalhe?: string;
  ip?: string;
};
