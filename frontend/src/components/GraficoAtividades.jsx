import { plural } from "../utils/formatacao";

const SEGMENTOS = [
  { chave: "concluidos", rotulo: "Concluídas", classe: "segmento-concluido" },
  { chave: "emAndamento", rotulo: "Em andamento", classe: "segmento-andamento" },
  { chave: "pendentes", rotulo: "Pendentes", classe: "segmento-pendente" },
];

function descricao(nome, eventos) {
  return `${nome}: ${eventos.concluidos} concluída(s), ${eventos.emAndamento} em andamento e ${eventos.pendentes} pendente(s), de ${plural(eventos.total, "atividade", "atividades")}`;
}

export default function GraficoAtividades({ disciplinas }) {
  return (
    <figure className="grafico">
      <ul className="grafico-legenda" aria-hidden="true">
        {SEGMENTOS.map((segmento) => (
          <li key={segmento.chave}>
            <span className={`grafico-amostra ${segmento.classe}`} />
            {segmento.rotulo}
          </li>
        ))}
      </ul>

      <ul className="grafico-linhas">
        {disciplinas.map((disciplina) => {
          const { eventos } = disciplina;

          return (
            <li key={disciplina.id} className="grafico-linha">
              <div className="grafico-rotulo">
                <span className="grafico-nome">{disciplina.nome}</span>
                <span className="grafico-valor">
                  {eventos.total === 0
                    ? "sem eventos"
                    : `${eventos.concluidos} de ${plural(eventos.total, "concluída", "concluídas")}`}
                </span>
              </div>

              <div className="grafico-trilho" role="img" aria-label={descricao(disciplina.nome, eventos)}>
                {SEGMENTOS.filter((segmento) => eventos[segmento.chave] > 0).map((segmento) => (
                  <span
                    key={segmento.chave}
                    className={`grafico-segmento ${segmento.classe}`}
                    style={{ flexGrow: eventos[segmento.chave] }}
                    title={`${segmento.rotulo}: ${eventos[segmento.chave]}`}
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
