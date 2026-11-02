import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EstadoVazio from "../components/EstadoVazio";
import EventoResumo from "../components/EventoResumo";
import Mensagem from "../components/Mensagem";
import Pagina from "../components/Pagina";
import * as disciplinaService from "../services/disciplinaService";
import { mensagemDeErro } from "../services/api";
import { excluirDisciplinaComConfirmacao } from "../utils/excluirDisciplina";
import { formatarData, textoPrazo } from "../utils/formatacao";
import "./DashboardPage.css";
import "./DisciplinasPage.css";

function subtitulo(disciplina) {
  const partes = [
    disciplina.professor,
    disciplina.semestre && `Semestre ${disciplina.semestre}`,
    disciplina.horario,
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
        disciplina.resumo.eventos.total
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

  const { eventos, proximoEvento } = disciplina.resumo;

  return (
    <Pagina
      titulo={disciplina.nome}
      subtitulo={subtitulo(disciplina)}
      acoes={
        <>
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
