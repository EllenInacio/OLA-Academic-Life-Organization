import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EstadoVazio from "../components/EstadoVazio";
import EventoResumo from "../components/EventoResumo";
import Mensagem from "../components/Mensagem";
import Pagina from "../components/Pagina";
import * as disciplinaService from "../services/disciplinaService";
import { mensagemDeErro } from "../services/api";
import { excluirDisciplinaComConfirmacao } from "../utils/excluirDisciplina";
import Selo from "../components/Selo";
import { BarraFrequencia } from "../components/FrequenciaCard";
import { SITUACAO_FREQUENCIA, SITUACAO_NOTA, rotuloRegra } from "../constants/desempenho";
import { textoPeriodo } from "../utils/aulasDaSemana";
import { formatarData, formatarNumero, formatarPercentual, plural, textoPrazo } from "../utils/formatacao";
import "./DashboardPage.css";
import "./DisciplinasPage.css";

function subtitulo(disciplina) {
  const partes = [
    disciplina.professor,
    disciplina.semestre && `Semestre ${disciplina.semestre}`,
    disciplina.horario,
    textoPeriodo(disciplina),
    disciplina.cargaHoraria && `${disciplina.cargaHoraria}h`,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(" · ") : "Sem informações complementares cadastradas";
}

export default function DisciplinaDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [disciplina, setDisciplina] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [naoEncontrada, setNaoEncontrada] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setDisciplina(await disciplinaService.buscar(id));
    } catch (falha) {
      if (falha?.response?.status === 404 || falha?.response?.status === 400) {
        setNaoEncontrada(true);
      } else {
        setErro(mensagemDeErro(falha));
      }
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function excluir() {
    try {
      const excluiu = await excluirDisciplinaComConfirmacao(
        disciplina,
        disciplinaService.remover,
        { eventos: disciplina.resumo.eventos.total, frequencias: disciplina.frequencias.length }
      );
      if (excluiu) {
        navigate("/disciplinas", {
          state: { mensagem: { texto: `Disciplina "${disciplina.nome}" excluída.`, tipo: "sucesso" } },
        });
      }
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    }
  }

  if (carregando || naoEncontrada || (!disciplina && erro)) {
    return (
      <Pagina titulo="Disciplina">
        <Link to="/disciplinas" className="voltar">
          ← Voltar para disciplinas
        </Link>
        {carregando && <p className="aviso-vazio">Carregando disciplina...</p>}
        {naoEncontrada && (
          <EstadoVazio
            titulo="Disciplina não encontrada"
            texto="Ela pode ter sido excluída ou o endereço está incorreto."
            acao={{ para: "/disciplinas", rotulo: "Ver minhas disciplinas" }}
          />
        )}
        {erro && (
          <>
            <Mensagem texto={erro} tipo="erro" />
            <button type="button" className="botao-secundario" onClick={carregar}>
              Tentar novamente
            </button>
          </>
        )}
      </Pagina>
    );
  }

  const { eventos, proximoEvento, desempenho, frequencia } = disciplina.resumo;

  return (
    <Pagina
      titulo={disciplina.nome}
      subtitulo={subtitulo(disciplina)}
      acoes={
        <>
          <Link to={`/notas-frequencia?disciplina=${disciplina.id}`} className="botao-principal">
            Notas e frequência
          </Link>
          <Link to={`/disciplinas?editar=${disciplina.id}`} className="botao-secundario">
            Editar
          </Link>
          <button type="button" className="botao-perigo" onClick={excluir}>
            Excluir
          </button>
        </>
      }
    >
      <Link to="/disciplinas" className="voltar">
        ← Voltar para disciplinas
      </Link>

      <Mensagem texto={erro} tipo="erro" aoFechar={() => setErro("")} />

      <div className="indicadores">
        <div className="indicador">
          <span className="indicador-rotulo">Eventos no calendário</span>
          <strong className="indicador-valor">{eventos.total}</strong>
        </div>
        <div className="indicador">
          <span className="indicador-rotulo">Pendentes</span>
          <strong className="indicador-valor">{eventos.abertos}</strong>
          {eventos.atrasados > 0 && (
            <span className="indicador-detalhe">{eventos.atrasados} com data já passada</span>
          )}
        </div>
        <div className="indicador">
          <span className="indicador-rotulo">Concluídos</span>
          <strong className="indicador-valor">{eventos.concluidos}</strong>
        </div>
        <div className="indicador">
          <span className="indicador-rotulo">Próximo evento</span>
          <strong className="indicador-valor indicador-texto">
            {proximoEvento ? proximoEvento.titulo : "—"}
          </strong>
          {proximoEvento && (
            <span className="indicador-detalhe">
              {formatarData(proximoEvento.data)} · {textoPrazo(proximoEvento.diasRestantes)}
            </span>
          )}
        </div>
      </div>

      <div className="painel-colunas">
        <section className="painel-bloco" aria-labelledby="titulo-desempenho">
          <h2 id="titulo-desempenho" className="painel-titulo">
            Desempenho
          </h2>
          <p className="painel-nota">
            {rotuloRegra(desempenho.regraMedia)}
            {desempenho.mediaAprovacao !== null
              ? ` · aprovação com ${formatarNumero(desempenho.mediaAprovacao)}`
              : " · média de aprovação não definida"}
          </p>
          <div className="detalhe-destaque">
            <strong>{desempenho.media === null ? "—" : formatarNumero(desempenho.media)}</strong>
            <div>
              <Selo situacao={desempenho.situacao} mapa={SITUACAO_NOTA} />
              <p className="painel-nota">
                {desempenho.avaliacoes.total === 0
                  ? "Nenhuma avaliação (evento com peso) cadastrada."
                  : `${desempenho.avaliacoes.comNota} de ${plural(desempenho.avaliacoes.total, "avaliação com nota", "avaliações com nota")}${desempenho.final ? " (média final)" : " (média parcial)"}`}
              </p>
            </div>
          </div>
          {desempenho.notaNecessaria && desempenho.notaNecessaria.alcancavel && desempenho.notaNecessaria.valor > 0 && (
            <p className="painel-nota">
              Para chegar à média: {formatarNumero(desempenho.notaNecessaria.valor)} nas avaliações restantes.
            </p>
          )}
          {desempenho.notaNecessaria && !desempenho.notaNecessaria.alcancavel && (
            <p className="painel-nota texto-critico-inline">
              A média de aprovação não é mais alcançável com as avaliações cadastradas.
            </p>
          )}
        </section>

        <section className="painel-bloco" aria-labelledby="titulo-freq-disciplina">
          <h2 id="titulo-freq-disciplina" className="painel-titulo">
            Frequência
          </h2>
          <p className="painel-nota">Limite de reprovação: {formatarPercentual(frequencia.limiteFaltas)} de faltas</p>
          <div className="detalhe-destaque">
            <strong>
              {frequencia.percentualFaltas === null ? "—" : formatarPercentual(frequencia.percentualFaltas)}
            </strong>
            <div>
              <Selo situacao={frequencia.situacao} mapa={SITUACAO_FREQUENCIA} />
              <p className="painel-nota">
                {frequencia.aulasRegistradas === 0
                  ? "Nenhuma aula registrada."
                  : `${plural(frequencia.faltas, "falta", "faltas")} em ${plural(frequencia.aulasRegistradas, "aula registrada", "aulas registradas")}`}
              </p>
            </div>
          </div>
          {frequencia.aulasRegistradas > 0 && <BarraFrequencia frequencia={frequencia} />}
          <p className="painel-nota">
            {frequencia.faltasPermitidas === null
              ? "Cadastre a carga horária para saber quantas faltas ainda são permitidas."
              : frequencia.faltasRestantes >= 0
                ? `Ainda pode faltar ${plural(frequencia.faltasRestantes, "aula", "aulas")} (limite: ${frequencia.faltasPermitidas}).`
                : `Limite de ${frequencia.faltasPermitidas} faltas ultrapassado.`}
          </p>
        </section>
      </div>

      <section className="painel-bloco" aria-labelledby="titulo-eventos-disciplina">
        <h2 id="titulo-eventos-disciplina" className="painel-titulo">
          Provas, trabalhos e entregas
        </h2>
        <p className="painel-nota">Eventos desta disciplina no calendário, em ordem de data.</p>

        {disciplina.eventos.length === 0 ? (
          <EstadoVazio
            texto="Nenhum evento cadastrado para esta disciplina."
            acao={{ para: "/calendario", rotulo: "Cadastrar no calendário" }}
          />
        ) : (
          <>
            <div className="detalhe-eventos">
              {disciplina.eventos.map((evento) => (
                <EventoResumo key={evento.id} evento={evento} mostrarDisciplina={false} mostrarStatus />
              ))}
            </div>
            <Link to="/calendario" className="painel-link">
              Gerenciar no calendário
            </Link>
          </>
        )}
      </section>
    </Pagina>
  );
}
