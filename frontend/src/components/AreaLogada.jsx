import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  IconeCalendario,
  IconeDashboard,
  IconeDisciplinas,
  IconePrivacidade,
  IconeSair,
} from "./Icones";
import "./AreaLogada.css";

const MENU = [
  { para: "/", rotulo: "Dashboard", icone: <IconeDashboard />, exato: true },
  { para: "/calendario", rotulo: "Calendário", icone: <IconeCalendario /> },
  { para: "/disciplinas", rotulo: "Disciplinas", icone: <IconeDisciplinas /> },
];

export default function AreaLogada() {
  const { usuario, sair } = useAuth();

  return (
    <div className="layout">
      <aside className="lateral">
        <div className="lateral-marca">
          <img src="/logo-ola.png" alt="" width="38" height="40" />
          <div>
            <span className="lateral-nome">OLA</span>
            <span className="lateral-slogan">Organização da Vida Acadêmica</span>
          </div>
        </div>

        <nav className="lateral-menu" aria-label="Navegação principal">
          {MENU.map((item) => (
            <NavLink key={item.para} to={item.para} end={item.exato} className="lateral-link">
              {item.icone}
              <span>{item.rotulo}</span>
            </NavLink>
          ))}
        </nav>

        <div className="lateral-rodape">
          <NavLink to="/privacidade" className="lateral-link lateral-link-secundario">
            <IconePrivacidade />
            <span>Privacidade e dados</span>
          </NavLink>
          <span className="lateral-usuario">{usuario.nome}</span>
          <button type="button" className="lateral-link lateral-sair" onClick={sair}>
            <IconeSair />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="layout-conteudo">
        <Outlet />
      </main>
    </div>
  );
}
