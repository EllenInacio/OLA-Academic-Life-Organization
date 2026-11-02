import { TIPOS_EVENTO, STATUS_EVENTO, rotuloDe } from "../constants/evento";

export default function EventoItem({ evento, aoEditar, aoExcluir }) {
  return (
    <article className="evento">
      <div className="evento-info">
        <h4 className="evento-titulo">{evento.titulo}</h4>
        <p className="evento-disciplina">{evento.disciplina.nome}</p>

        <div className="evento-tags">
          <span className="tag">{rotuloDe(TIPOS_EVENTO, evento.tipo)}</span>
          <span className={`tag tag-${evento.status.toLowerCase()}`}>
            {rotuloDe(STATUS_EVENTO, evento.status)}
          </span>
          <span className="tag tag-peso">Peso {Number(evento.peso)}</span>
        </div>
      </div>

      <div className="evento-acoes">
        <button
          type="button"
          className="botao-secundario"
          onClick={() => aoEditar(evento)}
        >
          Editar
        </button>
        <button
          type="button"
          className="botao-perigo"
          onClick={() => aoExcluir(evento)}
        >
          Excluir
        </button>
      </div>
    </article>
  );
}
