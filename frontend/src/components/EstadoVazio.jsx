import { Link } from "react-router-dom";

export default function EstadoVazio({ titulo, texto, acao }) {
  return (
    <div className="estado-vazio">
      {titulo && <h3>{titulo}</h3>}
      {texto && <p>{texto}</p>}
      {acao && (
        <Link to={acao.para} className="botao-principal estado-vazio-acao">
          {acao.rotulo}
        </Link>
      )}
    </div>
  );
}
