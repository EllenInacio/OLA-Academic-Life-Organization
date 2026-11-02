export default function Pagina({ titulo, subtitulo, acoes, children }) {
  return (
    <>
      <header className="pagina-cabecalho">
        <div>
          <h1>{titulo}</h1>
          {subtitulo && <p>{subtitulo}</p>}
        </div>
        {acoes && <div className="pagina-acoes">{acoes}</div>}
      </header>

      <div className="pagina-corpo">{children}</div>
    </>
  );
}
