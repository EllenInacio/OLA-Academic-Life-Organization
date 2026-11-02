import { Link } from "react-router-dom";
import EstadoVazio from "../components/EstadoVazio";
import EventoResumo from "../components/EventoResumo";
import GraficoAtividades from "../components/GraficoAtividades";
import Mensagem from "../components/Mensagem";
import Pagina from "../components/Pagina";
import { TIPOS_EVENTO, rotuloDe } from "../constants/evento";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../hooks/useDashboard";
import { formatarData, formatarDataExtensa, plural, textoPrazo } from "../utils/formatacao";
import "./DashboardPage.css";

const MAXIMO_ALERTAS = 5;

function subtituloDoPainel(painel) {
  if (!painel) return "Seu resumo acadêmico de hoje";

  const data = formatarDataExtensa(painel.hoje);
  return painel.semestres.length === 1
    ? `Semestre ${painel.semestres[0]} · seu resumo acadêmico de ${data}`
    : `Seu resumo acadêmico de ${data}`;
}

function Indicador({ rotulo, valor, detalhe, destaque = false }) {
  return (
    <div className={`indicador${destaque ? " indicador-destaque" : ""}`}>
      <span className="indicador-rotulo">{rotulo}</span>
      <strong className="indicador-valor">{valor}</strong>
      {detalhe && <span className="indicador-detalhe">{detalhe}</span>}
    </div>
  );
}

function TextoAlerta({ alerta }) {
  const { evento } = alerta;
  const nome = `${rotuloDe(TIPOS_EVENTO, evento.tipo)} "${evento.titulo}" (${evento.disciplina.nome})`;

  if (alerta.tipo === "PRAZO_VENCIDO") {
    return (
      <>
        <strong>{nome}</strong> — data: {formatarData(evento.data)} ({textoPrazo(evento.diasRestantes)}).
        O status ainda não foi atualizado para Concluído no calendário.
      </>
    );
  }

  return (
    <>
      <strong>{nome}</strong> — data: {formatarData(evento.data)} ({textoPrazo(evento.diasRestantes)}).
    </>
  );
}

function Alertas({ alertas }) {
  if (alertas.length === 0) return null;

  const visiveis = alertas.slice(0, MAXIMO_ALERTAS);
  const restantes = alertas.length - visiveis.length;

  return (
    <section className="painel-bloco" aria-labelledby="titulo-alertas">
      <h2 id="titulo-alertas" className="painel-titulo">
        Pontos de atenção
      </h2>
      <ul className="alertas">
        {visiveis.map((alerta) => (
          <li key={`${alerta.tipo}-${alerta.evento.id}`} className={`alerta alerta-${alerta.nivel}`}>
            <span className="alerta-selo">
              {alerta.tipo === "PRAZO_VENCIDO" ? "Prazo vencido" : alerta.nivel === "alto" ? "Urgente" : "Em breve"}
            </span>
            <span className="alerta-texto">
              <TextoAlerta alerta={alerta} />
            </span>
          </li>
        ))}
      </ul>
      {restantes > 0 && (
        <p className="painel-nota">
          E mais {plural(restantes, "ponto", "pontos")} de atenção. <Link to="/calendario">Ver no calendário</Link>
        </p>
      )}
    </section>
  );
}

function ConteudoDoPainel({ painel }) {
  const { resumo } = painel;

  if (resumo.disciplinas === 0) {
    return (
      <EstadoVazio
        titulo="Comece cadastrando suas disciplinas"
        texto="O painel é calculado a partir das suas disciplinas e dos eventos do calendário. Ainda não há dados para montar os indicadores."
        acao={{ para: "/disciplinas", rotulo: "Cadastrar disciplina" }}
      />
    );
  }

  const { eventos } = resumo;
  const semEventos = eventos.total === 0;

  return (
    <>
      <div className="indicadores">
        <Indicador rotulo="Disciplinas cadastradas" valor={resumo.disciplinas} />
        <Indicador
          rotulo="Atividades pendentes"
          valor={eventos.abertos}
          detalhe={eventos.emAndamento > 0 ? `${eventos.emAndamento} em andamento` : null}
        />
        <Indicador
          rotulo="Atividades concluídas"
          valor={eventos.concluidos}
          detalhe={semEventos ? null : `de ${plural(eventos.total, "atividade", "atividades")}`}
        />
        <Indicador
          rotulo={`Prazos nos próximos ${painel.regras.diasParaAlerta} dias`}
          valor={resumo.prazosProximos}
          detalhe={eventos.atrasados > 0 ? `${plural(eventos.atrasados, "vencida", "vencidas")} sem conclusão` : null}
          destaque={resumo.prazosProximos > 0}
        />
      </div>

      <Alertas alertas={painel.alertas} />

      {semEventos ? (
        <EstadoVazio
          titulo="Nenhuma prova, trabalho ou entrega cadastrado"
          texto="Cadastre os eventos das suas disciplinas no calendário para ver prazos, pendências e o andamento por disciplina."
          acao={{ para: "/calendario", rotulo: "Ir para o calendário" }}
        />
      ) : (
        <div className="painel-colunas">
          <section className="painel-bloco" aria-labelledby="titulo-andamento">
            <h2 id="titulo-andamento" className="painel-titulo">
              Andamento por disciplina
            </h2>
            <p className="painel-nota">Status das provas, trabalhos e entregas cadastrados.</p>
            <GraficoAtividades disciplinas={painel.disciplinas} />
          </section>

          <section className="painel-bloco" aria-labelledby="titulo-proximos">
            <h2 id="titulo-proximos" className="painel-titulo">
              Próximas provas e trabalhos
            </h2>
            <p className="painel-nota">Não concluídos, ordenados por data.</p>

            {painel.proximosEventos.length === 0 ? (
              <p className="aviso-vazio">Nenhuma atividade pendente de hoje em diante.</p>
            ) : (
              <div className="proximos">
                {painel.proximosEventos.map((evento) => (
                  <EventoResumo key={evento.id} evento={evento} />
                ))}
              </div>
            )}

            <Link to="/calendario" className="painel-link">
              Ver calendário completo
            </Link>
          </section>
        </div>
      )}
    </>
  );
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const { painel, carregando, erro, recarregar } = useDashboard();
  const primeiroNome = usuario.nome.split(" ")[0];

  return (
    <Pagina titulo={`Olá, ${primeiroNome}`} subtitulo={subtituloDoPainel(painel)}>
      {carregando && <p className="aviso-vazio">Carregando seu resumo acadêmico...</p>}

      {!carregando && erro && (
        <>
          <Mensagem texto={erro} tipo="erro" />
          <button type="button" className="botao-secundario" onClick={recarregar}>
            Tentar novamente
          </button>
        </>
      )}

      {!carregando && !erro && painel && <ConteudoDoPainel painel={painel} />}
    </Pagina>
  );
}
