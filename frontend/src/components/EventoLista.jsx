import EventoItem from "./EventoItem";

function formatarData(isoData) {
  const [ano, mes, dia] = isoData.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function agruparPorData(eventos) {
  const grupos = new Map();

  for (const evento of eventos) {
    const dia = evento.data.slice(0, 10);
    if (!grupos.has(dia)) {
      grupos.set(dia, []);
    }
    grupos.get(dia).push(evento);
  }

  return Array.from(grupos.entries());
}

export default function EventoLista({ eventos, carregando, aoEditar, aoExcluir }) {
  if (carregando) {
    return <p className="aviso-vazio">Carregando eventos...</p>;
  }

  if (eventos.length === 0) {
    return <p className="aviso-vazio">Nenhum evento cadastrado ainda.</p>;
  }

  return (
    <div className="lista">
      {agruparPorData(eventos).map(([dia, eventosDoDia]) => (
        <div className="grupo-dia" key={dia}>
          <h3 className="data-titulo">{formatarData(dia)}</h3>
          {eventosDoDia.map((evento) => (
            <EventoItem
              key={evento.id}
              evento={evento}
              aoEditar={aoEditar}
              aoExcluir={aoExcluir}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
