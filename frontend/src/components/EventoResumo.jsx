import { STATUS_EVENTO, TIPOS_EVENTO, rotuloDe } from "../constants/evento";
import { formatarData, formatarNumero, textoPrazo } from "../utils/formatacao";

function classeDoPrazo(dias) {
  if (dias === undefined || dias === null) return "";
  if (dias < 0) return "prazo-vencido";
  if (dias <= 2) return "prazo-urgente";
  if (dias <= 7) return "prazo-proximo";
  return "prazo-normal";
}

export default function EventoResumo({ evento, mostrarDisciplina = true, mostrarStatus = false }) {
  const dias = evento.status === "CONCLUIDO" ? null : evento.diasRestantes;
  const data = formatarData(evento.data);

  return (
    <article className={`evento-resumo tipo-${evento.tipo.toLowerCase()}`}>
      <div className="evento-resumo-tags">
        <span className="tag">{rotuloDe(TIPOS_EVENTO, evento.tipo)}</span>
        <span className={`tag tag-prazo ${classeDoPrazo(dias)}`}>
          {dias === undefined || dias === null ? data : `${data} · ${textoPrazo(dias)}`}
        </span>
        {mostrarStatus && (
          <span className={`tag tag-${evento.status.toLowerCase()}`}>
            {rotuloDe(STATUS_EVENTO, evento.status)}
          </span>
        )}
      </div>
      <h4 className="evento-resumo-titulo">{evento.titulo}</h4>
      <p className="evento-resumo-detalhe">
        {mostrarDisciplina && evento.disciplina ? `${evento.disciplina.nome} · ` : ""}
        peso {formatarNumero(evento.peso, 2)}
      </p>
    </article>
  );
}
