import "./AuthLayout.css";

function IconeGrafico() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M4 17l5-5 4 3 7-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconeCalendario() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconeMensagem() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 9h8M8 12h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const RECURSOS = [
  { icone: <IconeGrafico />, texto: "Médias por disciplina calculadas automaticamente" },
  { icone: <IconeCalendario />, texto: "Provas e trabalhos organizados por data" },
  { icone: <IconeMensagem />, texto: "Anote tudo escrevendo uma frase simples" },
];

export default function AuthLayout({ titulo, subtitulo, children }) {
  return (
    <div className="auth">
      <aside className="auth-apresentacao">
        <div className="auth-marca">
          <img src="/logo-ola.png" alt="" width="38" height="40" />
          <span>OLA</span>
        </div>

        <div className="auth-chamada">
          <h1>Toda a sua vida acadêmica em um só lugar.</h1>
          <p>
            Provas no celular, notas no portal, frequência em outro sistema e horário
            no papel? O OLA reúne tudo com telas prontas por funcionalidade.
          </p>

          <ul className="auth-recursos">
            {RECURSOS.map((recurso) => (
              <li key={recurso.texto}>
                <span className="auth-icone">{recurso.icone}</span>
                {recurso.texto}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="auth-conteudo">
        <div className="auth-cartao">
          <h2>{titulo}</h2>
          {subtitulo && <p className="auth-subtitulo">{subtitulo}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
