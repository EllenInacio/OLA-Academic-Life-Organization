import { useState } from "react";
import Mensagem from "../components/Mensagem";
import TermosPrivacidade from "../components/TermosPrivacidade";
import { useAuth } from "../contexts/AuthContext";
import { rotuloDaAcao } from "../constants/auditoria";
import * as lgpdService from "../services/lgpdService";
import { mensagemDeErro } from "../services/api";
import "./PrivacidadePage.css";

function formatarDataHora(iso) {
  return iso ? new Date(iso).toLocaleString("pt-BR") : "-";
}

function baixarJson(dados, nomeArquivo) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

export default function PrivacidadePage() {
  const { encerrarSessao } = useAuth();

  const [dados, setDados] = useState(null);
  const [logs, setLogs] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  async function executar(acao) {
    setOcupado(true);
    try {
      await acao();
    } catch (erro) {
      setMensagem({ texto: mensagemDeErro(erro), tipo: "erro" });
    } finally {
      setOcupado(false);
    }
  }

  function consultarDados() {
    executar(async () => setDados(await lgpdService.consultarDados()));
  }

  function exportarDados() {
    executar(async () => {
      baixarJson(await lgpdService.exportar(), "meus-dados-ola.json");
      setMensagem({ texto: "Arquivo com os seus dados gerado.", tipo: "sucesso" });
    });
  }

  function consultarHistorico() {
    executar(async () => setLogs(await lgpdService.listarLogs()));
  }

  function revogarConsentimento() {
    const confirmou = window.confirm(
      "Revogar o consentimento encerra sua sessão e bloqueia o acesso a esta conta. Seus dados ficam marcados para exclusão. Deseja continuar?"
    );
    if (!confirmou) return;

    executar(async () => {
      const resposta = await lgpdService.revogarConsentimento();
      encerrarSessao({ texto: resposta.mensagem, tipo: "sucesso" });
    });
  }

  function excluirConta() {
    const confirmou = window.confirm(
      "Esta ação é irreversível. Sua conta, disciplinas e eventos serão excluídos permanentemente. Deseja continuar?"
    );
    if (!confirmou) return;

    executar(async () => {
      const resposta = await lgpdService.excluirConta();
      encerrarSessao({ texto: resposta.mensagem, tipo: "sucesso" });
    });
  }

  return (
    <>
      <Mensagem texto={mensagem?.texto} tipo={mensagem?.tipo} aoFechar={() => setMensagem(null)} />

      <p className="privacidade-introducao">
        Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode acessar,
        exportar e excluir os dados pessoais que o OLA armazena sobre você.
      </p>

      <div className="colunas">
        <section>
          <div className="cartao">
            <h2>Seus dados</h2>
            <div className="privacidade-acoes">
              <button type="button" className="botao-secundario" onClick={consultarDados} disabled={ocupado}>
                Consultar meus dados
              </button>
              <button type="button" className="botao-secundario" onClick={exportarDados} disabled={ocupado}>
                Exportar meus dados (JSON)
              </button>
            </div>

            {dados && (
              <dl className="privacidade-dados">
                <dt>Nome de usuário</dt>
                <dd>{dados.dadosPessoais.nome}</dd>
                <dt>E-mail</dt>
                <dd>{dados.dadosPessoais.email}</dd>
                <dt>Conta criada em</dt>
                <dd>{formatarDataHora(dados.dadosPessoais.contaCriadaEm)}</dd>
                <dt>Termos aceitos em</dt>
                <dd>
                  {formatarDataHora(dados.dadosPessoais.consentimentoEm)} (versão{" "}
                  {dados.dadosPessoais.versaoTermos})
                </dd>
                <dt>Dados acadêmicos</dt>
                <dd>
                  {dados.dadosAcademicos.disciplinas} disciplina(s) e{" "}
                  {dados.dadosAcademicos.eventos} evento(s)
                </dd>
                <dt>Finalidade</dt>
                <dd>{dados.finalidade}</dd>
                <dt>Base legal</dt>
                <dd>{dados.baseLegal}</dd>
              </dl>
            )}
          </div>

          <div className="cartao">
            <h2>Consentimento e conta</h2>
            <p className="privacidade-aviso">
              Revogar o consentimento encerra a sessão e bloqueia o acesso; os dados ficam
              marcados para exclusão.
            </p>
            <button type="button" className="botao-secundario" onClick={revogarConsentimento} disabled={ocupado}>
              Revogar consentimento
            </button>

            <p className="privacidade-aviso">
              Excluir a conta remove permanentemente seus dados pessoais, disciplinas e eventos.
            </p>
            <button type="button" className="botao-perigo" onClick={excluirConta} disabled={ocupado}>
              Excluir minha conta
            </button>
          </div>
        </section>

        <section>
          <div className="cartao">
            <h2>Histórico de acessos e ações</h2>
            <button type="button" className="botao-secundario" onClick={consultarHistorico} disabled={ocupado}>
              {logs ? "Atualizar histórico" : "Ver histórico"}
            </button>

            {logs && logs.length === 0 && <p className="aviso-vazio">Nenhum registro encontrado.</p>}

            {logs && logs.length > 0 && (
              <div className="privacidade-tabela">
                <table>
                  <thead>
                    <tr>
                      <th>Ação</th>
                      <th>Data e hora</th>
                      <th>Detalhe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, indice) => (
                      <tr key={`${log.dataHora}-${indice}`}>
                        <td>{rotuloDaAcao(log.acao)}</td>
                        <td>{formatarDataHora(log.dataHora)}</td>
                        <td>{log.detalhe || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <details className="cartao privacidade-termos">
            <summary>Termos de Uso e Política de Privacidade</summary>
            <TermosPrivacidade />
          </details>
        </section>
      </div>
    </>
  );
}
