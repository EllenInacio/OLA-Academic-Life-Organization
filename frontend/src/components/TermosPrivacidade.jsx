import "./TermosPrivacidade.css";

export const VERSAO_TERMOS = "1.0";

export default function TermosPrivacidade() {
  return (
    <div className="termos">
      <p>
        Ao criar uma conta, você concorda com os <strong>Termos de Uso</strong> e com a{" "}
        <strong>Política de Privacidade</strong> do OLA, incluindo o tratamento dos seus
        dados pessoais conforme a <strong>Lei Geral de Proteção de Dados (Lei nº
        13.709/2018 — LGPD)</strong>. Versão {VERSAO_TERMOS}.
      </p>

      <h3>Termos de Uso</h3>
      <p>
        O OLA é uma plataforma web desenvolvida como Projeto Final de Curso de Engenharia de
        Software da Universidade de Mogi das Cruzes (UMC) para que estudantes organizem
        disciplinas, provas, trabalhos e entregas.
      </p>
      <p>
        A conta é pessoal. Você é responsável por manter em segurança sua senha e o aplicativo
        autenticador usado na verificação em duas etapas. As informações acadêmicas são
        cadastradas por você, servem para a sua organização e não substituem os sistemas
        oficiais da instituição.
      </p>

      <h3>Política de Privacidade</h3>
      <p className="termos-subtitulo">Quais dados coletamos e para quê</p>
      <ul>
        <li>
          <strong>Nome de usuário e e-mail:</strong> identificar você e enviar códigos de
          verificação e de recuperação de senha.
        </li>
        <li>
          <strong>Senha:</strong> autenticação. É guardada somente como hash irreversível
          (Argon2id).
        </li>
        <li>
          <strong>Segredo da verificação em duas etapas:</strong> validar os códigos do
          aplicativo autenticador. É guardado criptografado (AES-256-GCM).
        </li>
        <li>
          <strong>Dados acadêmicos:</strong> disciplinas, professores, provas, trabalhos e
          entregas, com datas, pesos e status, para o funcionamento do calendário.
        </li>
        <li>
          <strong>Registros de auditoria:</strong> ação realizada, data, hora e endereço IP,
          para a segurança e a rastreabilidade dos acessos.
        </li>
      </ul>

      <p className="termos-subtitulo">Base legal</p>
      <p>O tratamento é realizado com base no seu consentimento (art. 7º, I, da LGPD).</p>

      <p className="termos-subtitulo">Como protegemos seus dados</p>
      <p>
        A comunicação no ambiente publicado ocorre por HTTPS. O acesso exige senha e código de
        verificação, e cada conta enxerga somente os próprios dados. O token de acesso fica
        apenas na memória da página e é descartado ao sair ou ao recarregar a página. O OLA
        não utiliza cookies de rastreamento ou de publicidade.
      </p>

      <p className="termos-subtitulo">Compartilhamento</p>
      <p>
        Seus dados <strong>não são vendidos nem compartilhados</strong> para fins comerciais.
        Os e-mails de verificação são enviados por um provedor de e-mail, e a aplicação e o
        banco de dados ficam em serviços de hospedagem, que atuam apenas como operadores. O
        compartilhamento com autoridades ocorre somente por obrigação legal ou ordem judicial.
      </p>

      <p className="termos-subtitulo">Retenção</p>
      <p>
        Os dados são mantidos enquanto a conta estiver ativa. Ao excluir a conta, seus dados
        pessoais e acadêmicos são removidos; os registros de auditoria permanecem, sem vínculo
        com a conta, para fins de segurança.
      </p>

      <p className="termos-subtitulo">Seus direitos</p>
      <p>
        Na página <strong>Privacidade e dados</strong>, você pode a qualquer momento consultar
        seus dados, exportá-los em formato JSON, ver o histórico de acessos e ações, revogar
        este consentimento e excluir sua conta (art. 18 da LGPD). Revogar o consentimento
        encerra a sessão e bloqueia o acesso à conta, cujos dados ficam marcados para exclusão.
      </p>

      <p className="termos-subtitulo">Responsável</p>
      <p>Ellen Alves Inacio — Projeto Final de Curso, UMC.</p>
    </div>
  );
}
