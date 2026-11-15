import { Link } from "react-router-dom";
import CalendarioMensal from "../components/CalendarioMensal";
import EstadoVazio from "../components/EstadoVazio";
import EventoResumo from "../components/EventoResumo";
import { BarraFrequencia, textoFaltasEmAulas } from "../components/FrequenciaCard";
import GraficoAtividades from "../components/GraficoAtividades";
import Mensagem from "../components/Mensagem";
import Pagina from "../components/Pagina";
import Selo from "../components/Selo";
import { TIPOS_EVENTO, rotuloDe } from "../constants/evento";
import { SITUACAO_FREQUENCIA, SITUACAO_NOTA, estadoDaMedia } from "../constants/desempenho";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../hooks/useDashboard";
import { useEventos } from "../hooks/useEventos";
import { aulasPorDiaDaSemana } from "../utils/aulasDaSemana";
import {
  formatarData,
  formatarDataExtensa,
  formatarNumero,
  formatarPercentual,
  plural,
  textoPrazo,
} from "../utils/formatacao";
import "./DashboardPage.css";

const MAXIMO_ALERTAS = 6;

const SELO_DO_ALERTA = {
  PRAZO_PROXIMO: (alerta) => (alerta.nivel === "alto" ? "Urgente" : "Em breve"),
  PRAZO_VENCIDO: () => "Prazo vencido",
  FREQUENCIA_ACIMA_DO_LIMITE: () => "Frequência",
  FREQUENCIA_PERTO_DO_LIMITE: () => "Frequência",
  MEDIA_INALCANCAVEL: () => "Média",
  MEDIA_ABAIXO: () => "Média",
  NOTA_AGUARDANDO: () => "Nota pendente",
};

function subtituloDoPainel(painel) {
  if (!painel) return "Seu resumo acadêmico de hoje";

  return `Seu resumo acadêmico de ${formatarDataExtensa(painel.hoje)}`;
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
  const { evento, disciplina, valores = {} } = alerta;
  const linkNotas = <Link to={`/notas-frequencia?disciplina=${disciplina.id}`}>Ver notas e frequência</Link>;

  switch (alerta.tipo) {
    case "PRAZO_PROXIMO":
    case "PRAZO_VENCIDO": {
      const nome = `${rotuloDe(TIPOS_EVENTO, evento.tipo)} "${evento.titulo}" (${disciplina.nome})`;
      return (
        <>
          <strong>{nome}</strong> — data: {formatarData(evento.data)} ({textoPrazo(evento.diasRestantes)}).
          {alerta.tipo === "PRAZO_VENCIDO" &&
            " O status ainda não foi atualizado para Concluído no calendário."}
        </>
      );
    }
    case "FREQUENCIA_ACIMA_DO_LIMITE":
    case "FREQUENCIA_PERTO_DO_LIMITE": {
      const acima = alerta.tipo === "FREQUENCIA_ACIMA_DO_LIMITE";
      const detalhe = `${plural(valores.faltas, "falta", "faltas")} de ${valores.faltasPermitidas} permitidas`;
      return (
        <>
          <strong>{disciplina.nome}</strong> —{" "}
          {acima ? "limite de faltas ultrapassado" : "perto do limite de faltas"}: {detalhe}. {linkNotas}
        </>
      );
    }
    case "MEDIA_INALCANCAVEL":
      return (
        <>
          <strong>{disciplina.nome}</strong> — mesmo com 10 nas avaliações restantes, a média não chega a{" "}
          {formatarNumero(valores.mediaAprovacao)} com as avaliações cadastradas. {linkNotas}
        </>
      );
    case "MEDIA_ABAIXO":
      return (
        <>
          <strong>{disciplina.nome}</strong> — média {formatarNumero(valores.media)} abaixo da média de
          aprovação ({formatarNumero(valores.mediaAprovacao)})
          {valores.notaNecessaria !== null
            ? `. Para chegar lá, a média nas próximas avaliações precisa ser ${formatarNumero(valores.notaNecessaria)}.`
            : "."}{" "}
          {linkNotas}
        </>
      );
    case "NOTA_AGUARDANDO":
      return (
        <>
          <strong>{disciplina.nome}</strong> —{" "}
          {plural(valores.quantidade, "avaliação concluída", "avaliações concluídas")} sem nota registrada.{" "}
          {linkNotas}
        </>
      );
    default:
      return <strong>{disciplina.nome}</strong>;
  }
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
          <li
            key={`${alerta.tipo}-${alerta.evento?.id ?? alerta.disciplina.id}`}
            className={`alerta alerta-${alerta.nivel}`}
          >
            <span className="alerta-selo">{SELO_DO_ALERTA[alerta.tipo]?.(alerta) ?? "Atenção"}</span>
            <span className="alerta-texto">
              <TextoAlerta alerta={alerta} />
            </span>
          </li>
        ))}
      </ul>
      {restantes > 0 && (
        <p className="painel-nota">E mais {plural(restantes, "ponto", "pontos")} de atenção.</p>
      )}
    </section>
  );
}

function MediasPorDisciplina({ disciplinas }) {
  return (
    <section className="painel-bloco" aria-labelledby="titulo-medias">
      <h2 id="titulo-medias" className="painel-titulo">
        Média por disciplina
      </h2>
      <p className="painel-nota">
        Média geral de cada disciplina com as notas lançadas (M1 e M2 com o peso da disciplina). Enquanto
        faltam notas, o resultado é parcial e provisório.
      </p>

      <ul className="medias">
        {disciplinas.map(({ id, nome, professor, desempenho }) => (
          <li key={id} className="media-item">
            <Link to={`/notas-frequencia?disciplina=${id}`} className="media-link">
              <span className="media-info">
                <span className="media-nome">{nome}</span>
                <span className="media-detalhe">
                  {professor ? `${professor} · ` : ""}
                  {desempenho.avaliacoes.total === 0
                    ? "nenhuma avaliação cadastrada"
                    : `${desempenho.avaliacoes.comNota} de ${plural(desempenho.avaliacoes.total, "avaliação lançada", "avaliações lançadas")}`}
                </span>
                {desempenho.media !== null && (
                  <span className="media-detalhe">
                    {desempenho.etapas
                      .map((etapa) => `${etapa.etapa} ${etapa.media === null ? "sem notas" : formatarNumero(etapa.media)}`)
                      .join(" · ")}
                    {` · ${estadoDaMedia(desempenho).curto}`}
                  </span>
                )}
                {desempenho.media !== null && <Selo situacao={desempenho.situacao} mapa={SITUACAO_NOTA} />}
              </span>
              <strong className="media-valor">
                {desempenho.media === null ? "—" : formatarNumero(desempenho.media)}
              </strong>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FrequenciaPorDisciplina({ disciplinas }) {
  return (
    <section className="painel-bloco" aria-labelledby="titulo-frequencia-painel">
      <h2 id="titulo-frequencia-painel" className="painel-titulo">
        Frequência
      </h2>
      <p className="painel-nota">
        Percentual sobre o total de aulas de cada disciplina. A barra mostra quanto do limite de faltas já foi
        usado.
      </p>

      <ul className="frequencias">
        {disciplinas.map(({ id, nome, frequencia }) => (
          <li key={id} className="frequencia-item">
            <div className="frequencia-topo">
              <Link to={`/notas-frequencia?disciplina=${id}`} className="frequencia-nome">
                {nome}
              </Link>
              <span className="frequencia-percentual">
                {frequencia.percentualFaltas === null
                  ? "sem registros"
                  : `${formatarPercentual(frequencia.percentualFaltas)} de faltas`}
              </span>
            </div>
            {frequencia.aulasRegistradas > 0 && <BarraFrequencia frequencia={frequencia} />}
            <div className="frequencia-rodape">
              <span>
                {frequencia.aulasRegistradas === 0
                  ? "Nenhuma aula registrada"
                  : textoFaltasEmAulas(frequencia)}
                {frequencia.faltasRestantes !== null &&
                  frequencia.aulasRegistradas > 0 &&
                  frequencia.faltasRestantes >= 0 &&
                  ` · ainda pode faltar ${frequencia.faltasRestantes}`}
              </span>
              {frequencia.aulasRegistradas > 0 && (
                <Selo situacao={frequencia.situacao} mapa={SITUACAO_FREQUENCIA} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CalendarioGeral({ disciplinas }) {
  const { eventos, carregando, erroEventos } = useEventos();
  const aulas = aulasPorDiaDaSemana(disciplinas);
  const temAulas = Object.keys(aulas).length > 0;

  return (
    <section className="painel-bloco" aria-labelledby="titulo-calendario-geral">
      <h2 id="titulo-calendario-geral" className="painel-titulo">
        Calendário geral
      </h2>
      <p className="painel-nota">
        Provas, trabalhos e entregas do calendário e os dias de aula de cada disciplina.
        {!temAulas && (
          <>
            {" "}
            Para ver os dias de aula aqui, informe o horário semanal na <Link to="/disciplinas">disciplina</Link>.
          </>
        )}
      </p>

      {erroEventos && <Mensagem texto={erroEventos} tipo="erro" />}
      {carregando && <p className="aviso-vazio">Carregando calendário...</p>}
      {!carregando && !erroEventos && <CalendarioMensal eventos={eventos} aulas={aulas} />}
    </section>
  );
}

function ConteudoDoPainel({ painel }) {
  const { resumo } = painel;

  if (resumo.disciplinas === 0) {
    return (
      <EstadoVazio
        titulo="Comece cadastrando suas disciplinas"
        texto="O painel é calculado a partir das suas disciplinas, dos eventos do calendário, das notas e da frequência. Ainda não há dados para montar os indicadores."
        acao={{ para: "/disciplinas", rotulo: "Cadastrar disciplina" }}
      />
    );
  }

  const { eventos, mediaGeral } = resumo;
  const parciais = painel.disciplinas.filter((d) => d.desempenho.media !== null && !d.desempenho.final).length;
  const semEventos = eventos.total === 0;

  return (
    <>
      <div className="indicadores">
        <Indicador rotulo="Disciplinas" valor={resumo.disciplinas} />
        <Indicador
          rotulo="Média geral"
          valor={mediaGeral.valor === null ? "—" : formatarNumero(mediaGeral.valor)}
          detalhe={
            mediaGeral.valor === null
              ? "nenhuma nota lançada"
              : `média de ${plural(mediaGeral.disciplinasComNota, "disciplina", "disciplinas")} com nota${
                  parciais > 0 ? ` · ${plural(parciais, "parcial", "parciais")}` : ""
                }`
          }
        />
        <Indicador
          rotulo="Atividades pendentes"
          valor={eventos.abertos}
          detalhe={
            semEventos ? null : `${eventos.concluidos} de ${plural(eventos.total, "concluída", "concluídas")}`
          }
        />
        <Indicador
          rotulo={`Prazos em até ${painel.regras.diasParaAlerta} dias`}
          valor={resumo.prazosProximos}
          detalhe={
            eventos.atrasados > 0 ? `${plural(eventos.atrasados, "vencida", "vencidas")} sem conclusão` : null
          }
          destaque={resumo.prazosProximos > 0}
        />
        <Indicador
          rotulo="Disciplinas em atenção"
          valor={resumo.disciplinasEmAtencao}
          detalhe="por média ou frequência"
          destaque={resumo.disciplinasEmAtencao > 0}
        />
      </div>

      <Alertas alertas={painel.alertas} />

      <div className="painel-colunas">
        <div className="painel-coluna">
          <MediasPorDisciplina disciplinas={painel.disciplinas} />
          <FrequenciaPorDisciplina disciplinas={painel.disciplinas} />
        </div>

        <div className="painel-coluna">
          <section className="painel-bloco" aria-labelledby="titulo-proximos">
            <h2 id="titulo-proximos" className="painel-titulo">
              Próximas provas e trabalhos
            </h2>
            <p className="painel-nota">Não concluídos, ordenados por data.</p>

            {painel.proximosEventos.length === 0 ? (
              <p className="aviso-vazio">
                {semEventos
                  ? "Nenhuma prova, trabalho ou entrega cadastrado."
                  : "Nenhuma atividade pendente de hoje em diante."}
              </p>
            ) : (
              <div className="proximos">
                {painel.proximosEventos.map((evento) => (
                  <EventoResumo key={evento.id} evento={evento} />
                ))}
              </div>
            )}

            <Link to="/calendario" className="painel-link">
              {semEventos ? "Cadastrar no calendário" : "Ver calendário completo"}
            </Link>
          </section>

          {!semEventos && (
            <section className="painel-bloco" aria-labelledby="titulo-andamento">
              <h2 id="titulo-andamento" className="painel-titulo">
                Andamento por disciplina
              </h2>
              <p className="painel-nota">Status das provas, trabalhos e entregas cadastrados.</p>
              <GraficoAtividades disciplinas={painel.disciplinas} />
            </section>
          )}
        </div>
      </div>

      <CalendarioGeral disciplinas={painel.disciplinas} />
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
