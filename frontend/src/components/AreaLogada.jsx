import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./AreaLogada.css";

export default function AreaLogada() {
  const { usuario, sair } = useAuth();

  return (
    <div className="app">
      <header className="cabecalho cabecalho-logado">
        <div className="cabecalho-marca">
          <img src="/logo-ola.png" alt="" width="34" height="36" />
          <div>
            <h1>OLA</h1>
            <p>Organização da Vida Acadêmica</p>
          </div>
        </div>

        <nav className="menu" aria-label="Navegação principal">
          <NavLink to="/" end className="menu-link">
            Calendário
          </NavLink>
          <NavLink to="/privacidade" className="menu-link">
            Privacidade e dados
          </NavLink>
          <span className="menu-usuario">{usuario.nome}</span>
          <button type="button" className="botao-secundario" onClick={sair}>
            Sair
          </button>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
