import { useState } from "react";
import "./CalendarioMensal.css";

const NOMES_MES = [
  "JANEIRO",
  "FEVEREIRO",
  "MARÇO",
  "ABRIL",
  "MAIO",
  "JUNHO",
  "JULHO",
  "AGOSTO",
  "SETEMBRO",
  "OUTUBRO",
  "NOVEMBRO",
  "DEZEMBRO",
];

const NOMES_DIA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function chaveDeData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function chaveDoEvento(evento) {
  return String(evento.data ?? "").slice(0, 10);
}

function classeDoTipo(tipo) {
  const normalizado = String(tipo ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalizado.includes("prova")) return "chip-prova";
  if (normalizado.includes("trabalho")) return "chip-trabalho";
  if (normalizado.includes("entrega")) return "chip-entrega";
  return "chip-outro";
}

function agruparPorDia(eventos) {
  const mapa = {};

  for (const evento of eventos) {
    const chave = chaveDoEvento(evento);
    if (!chave) continue;
    if (!mapa[chave]) mapa[chave] = [];
    mapa[chave].push(evento);
  }

  return mapa;
}

function gerarCelulas(mesVisivel) {
  const primeiroDia = new Date(
    mesVisivel.getFullYear(),
    mesVisivel.getMonth(),
    1
  );
  const inicioDaGrade = new Date(primeiroDia);
  inicioDaGrade.setDate(primeiroDia.getDate() - primeiroDia.getDay());

  const celulas = [];

  for (let i = 0; i < 42; i++) {
    const data = new Date(inicioDaGrade);
    data.setDate(inicioDaGrade.getDate() + i);

    celulas.push({
      data,
      doMesAtual: data.getMonth() === mesVisivel.getMonth(),
    });
  }

  return celulas;
}

export default function CalendarioMensal({ eventos = [] }) {
  const hoje = new Date();

  const [mesVisivel, setMesVisivel] = useState(
    new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  );

  const eventosPorDia = agruparPorDia(eventos);
  const celulas = gerarCelulas(mesVisivel);
  const chaveDeHoje = chaveDeData(hoje);

  function irParaMesAnterior() {
    setMesVisivel(
      new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() - 1, 1)
    );
  }

  function irParaProximoMes() {
    setMesVisivel(
      new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + 1, 1)
    );
  }

  function voltarParaHoje() {
    setMesVisivel(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  }

  return (
    <section className="calendario">
      <header className="calendario-cabecalho">
        <div className="calendario-titulo">
          <button
            type="button"
            className="calendario-seta"
            onClick={irParaMesAnterior}
            aria-label="Mês anterior"
          >
            &#8249;
          </button>

          <h3>
            {NOMES_MES[mesVisivel.getMonth()]} {mesVisivel.getFullYear()}
          </h3>

          <button
            type="button"
            className="calendario-seta"
            onClick={irParaProximoMes}
            aria-label="Próximo mês"
          >
            &#8250;
          </button>
        </div>

        <button
          type="button"
          className="calendario-hoje"
          onClick={voltarParaHoje}
        >
          Hoje
        </button>
      </header>

      <div className="calendario-semana">
        {NOMES_DIA.map((nome) => (
          <span key={nome} className="calendario-nome-dia">
            {nome}
          </span>
        ))}
      </div>

      <div className="calendario-grade">
        {celulas.map(({ data, doMesAtual }) => {
          const chave = chaveDeData(data);
          const eventosDoDia = eventosPorDia[chave] ?? [];
          const ehHoje = chave === chaveDeHoje;

          const classes = [
            "calendario-dia",
            doMesAtual ? "" : "fora-do-mes",
            ehHoje ? "eh-hoje" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={chave} className={classes}>
              <span className="calendario-numero">{data.getDate()}</span>

              <div className="calendario-eventos">
                {eventosDoDia.map((evento) => (
                  <span
                    key={evento.id}
                    className={`calendario-chip ${classeDoTipo(evento.tipo)}`}
                    title={`${evento.titulo}${
                      evento.disciplina?.nome ? ` — ${evento.disciplina.nome}` : ""
                    }`}
                  >
                    {evento.titulo}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="calendario-legenda">
        <span className="calendario-chip chip-prova">Prova</span>
        <span className="calendario-chip chip-trabalho">Trabalho</span>
        <span className="calendario-chip chip-entrega">Entrega</span>
      </footer>
    </section>
  );
}
