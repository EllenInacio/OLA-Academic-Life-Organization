import CalendarioPage from "./pages/CalendarioPage";

export default function App() {
  return (
    <div className="app">
      <header className="cabecalho">
        <h1>OLA</h1>
        <p>Organização da Vida Acadêmica</p>
      </header>

      <main>
        <CalendarioPage />
      </main>
    </div>
  );
}
