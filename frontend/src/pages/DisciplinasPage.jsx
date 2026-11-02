import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import EstadoVazio from "../components/EstadoVazio";
import GestaoDisciplinaForm from "../components/GestaoDisciplinaForm";
import Mensagem from "../components/Mensagem";
import Pagina from "../components/Pagina";
import { useDisciplinas } from "../hooks/useDisciplinas";
import { mensagemDeErro } from "../services/api";
import { excluirDisciplinaComConfirmacao } from "../utils/excluirDisciplina";
import { plural } from "../utils/formatacao";
import "./DisciplinasPage.css";

function infoComplementar(disciplina) {
  return [disciplina.horario, disciplina.cargaHoraria ? `${disciplina.cargaHoraria}h` : null]
    .filter(Boolean)
    .join(" · ");
}

function DisciplinaCard({ disciplina, emEdicao, aoEditar, aoExcluir }) {
  const info = infoComplementar(disciplina);

  return (
    <article className={`disciplina-card${emEdicao ? " disciplina-card-ativa" : ""}`}>
      <div className="disciplina-card-topo">
        <div>
          <h3 className="disciplina-card-nome">
            <Link to={`/disciplinas/${disciplina.id}`}>{disciplina.nome}</Link>
          </h3>
          <p className="disciplina-card-professor">
            {disciplina.professor || "Professor(a) não informado(a)"}
          </p>
        </div>
        <div className="disciplina-card-tags">
          {disciplina.semestre && <span className="tag">{disciplina.semestre}</span>}
          <span className="tag tag-peso">{plural(disciplina.totalEventos, "evento", "eventos")}</span>
        </div>
      </div>

      {info && <p className="disciplina-card-info">{info}</p>}

      <div className="disciplina-card-acoes">
        <Link to={`/disciplinas/${disciplina.id}`} className="botao-secundario">
          Detalhes
        </Link>
        <button type="button" className="botao-secundario" onClick={() => aoEditar(disciplina)}>
          Editar
        </button>
        <button type="button" className="botao-perigo" onClick={() => aoExcluir(disciplina)}>
          Excluir
        </button>
      </div>
    </article>
  );
}

export default function DisciplinasPage() {
  const {
    disciplinas,
    carregando,
    erroDisciplinas,
    criarDisciplina,
    atualizarDisciplina,
    removerDisciplina,
  } = useDisciplinas();

  const location = useLocation();
  const navigate = useNavigate();
  const [parametros] = useSearchParams();
  const formularioRef = useRef(null);

  const [emEdicao, setEmEdicao] = useState(null);
  const [mensagem, setMensagem] = useState(location.state?.mensagem ?? null);
  const [filtroSemestre, setFiltroSemestre] = useState("");

  useEffect(() => {
    const id = Number(parametros.get("editar"));
    if (!id || carregando) return;

    const alvo = disciplinas.find((disciplina) => disciplina.id === id);
    if (alvo) setEmEdicao(alvo);
    navigate("/disciplinas", { replace: true });
  }, [parametros, disciplinas, carregando, navigate]);

  useEffect(() => {
    if (emEdicao) formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [emEdicao]);

  const semestres = [...new Set(disciplinas.map((d) => d.semestre).filter(Boolean))].sort().reverse();
  const visiveis = filtroSemestre
    ? disciplinas.filter((disciplina) => disciplina.semestre === filtroSemestre)
    : disciplinas;

  async function salvar(dados) {
    try {
      if (emEdicao) {
        await atualizarDisciplina(emEdicao.id, dados);
        setEmEdicao(null);
        setMensagem({ texto: "Disciplina atualizada com sucesso.", tipo: "sucesso" });
      } else {
        await criarDisciplina(dados);
        setMensagem({ texto: "Disciplina cadastrada com sucesso.", tipo: "sucesso" });
      }
      return true;
    } catch (erro) {
      setMensagem({ texto: mensagemDeErro(erro), tipo: "erro" });
      return false;
    }
  }

  async function excluir(disciplina) {
    try {
      const excluiu = await excluirDisciplinaComConfirmacao(
        disciplina,
        removerDisciplina,
        disciplina.totalEventos
      );
      if (!excluiu) return;

      if (emEdicao?.id === disciplina.id) setEmEdicao(null);
      setMensagem({ texto: `Disciplina "${disciplina.nome}" excluída.`, tipo: "sucesso" });
    } catch (erro) {
      setMensagem({ texto: mensagemDeErro(erro), tipo: "erro" });
    }
  }

  return (
    <Pagina
      titulo="Gestão de disciplinas"
      subtitulo="Organize as matérias do semestre — elas são a base do calendário e do dashboard"
    >
      <Mensagem texto={mensagem?.texto} tipo={mensagem?.tipo} aoFechar={() => setMensagem(null)} />
      <Mensagem texto={erroDisciplinas} tipo="erro" />

      <div className="disciplinas-colunas">
        <section aria-labelledby="titulo-minhas-disciplinas">
          <div className="disciplinas-topo">
            <h2 id="titulo-minhas-disciplinas" className="titulo-lista">
              Minhas disciplinas
            </h2>

            {semestres.length > 1 && (
              <div className="campo disciplinas-filtro">
                <label htmlFor="filtro-semestre">Semestre</label>
                <select
                  id="filtro-semestre"
                  value={filtroSemestre}
                  onChange={(e) => setFiltroSemestre(e.target.value)}
                >
                  <option value="">Todos</option>
                  {semestres.map((semestre) => (
                    <option key={semestre} value={semestre}>
                      {semestre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {carregando && <p className="aviso-vazio">Carregando disciplinas...</p>}

          {!carregando && !erroDisciplinas && disciplinas.length === 0 && (
            <EstadoVazio
              titulo="Nenhuma disciplina cadastrada"
              texto="Use o formulário de cadastro para incluir a primeira. Ela passa a aparecer no calendário e no dashboard."
            />
          )}

          <div className="disciplinas-lista">
            {visiveis.map((disciplina) => (
              <DisciplinaCard
                key={disciplina.id}
                disciplina={disciplina}
                emEdicao={emEdicao?.id === disciplina.id}
                aoEditar={setEmEdicao}
                aoExcluir={excluir}
              />
            ))}
          </div>
        </section>

        <GestaoDisciplinaForm
          ref={formularioRef}
          disciplinaEmEdicao={emEdicao}
          aoSalvar={salvar}
          aoCancelar={() => setEmEdicao(null)}
        />
      </div>
    </Pagina>
  );
}
