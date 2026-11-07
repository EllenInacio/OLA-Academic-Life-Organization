import { useEffect, useState } from "react";
import { DIAS_SEMANA, HORARIO_PADRAO, lerHorario, montarHorario } from "../utils/horario";
import "./SeletorHorario.css";

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

// Selects em vez de <input type="time">: o formato 24 h não depende do idioma do navegador.
function Hora({ rotulo, valor, aoMudar }) {
  const [hora, minuto] = valor.split(":");
  const minutos = MINUTOS.includes(minuto) ? MINUTOS : [...MINUTOS, minuto].sort();

  return (
    <span className="seletor-hora">
      <select aria-label={`${rotulo} (hora)`} value={hora} onChange={(e) => aoMudar(`${e.target.value}:${minuto}`)}>
        {HORAS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      :
      <select aria-label={`${rotulo} (minuto)`} value={minuto} onChange={(e) => aoMudar(`${hora}:${e.target.value}`)}>
        {minutos.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </span>
  );
}

export default function SeletorHorario({ valor, aoMudar }) {
  const [selecao, setSelecao] = useState(() => lerHorario(valor) ?? {});
  const textoAntigo = valor && lerHorario(valor) === null ? valor : "";

  // Quando o formulário troca de disciplina ou é limpo, o valor muda por fora.
  useEffect(() => {
    if (montarHorario(selecao) !== valor) setSelecao(lerHorario(valor) ?? {});
  }, [valor]);

  function atualizar(nova) {
    setSelecao(nova);
    aoMudar(montarHorario(nova));
  }

  function alternarDia(sigla) {
    const nova = { ...selecao };
    if (nova[sigla]) delete nova[sigla];
    else nova[sigla] = { ...HORARIO_PADRAO };
    atualizar(nova);
  }

  function mudarHora(sigla, campo, hora) {
    atualizar({ ...selecao, [sigla]: { ...selecao[sigla], [campo]: hora } });
  }

  const diasEscolhidos = DIAS_SEMANA.filter((dia) => selecao[dia.sigla]);

  return (
    <div className="campo seletor-horario">
      <span className="seletor-horario-titulo" id="horario-titulo">
        Dias e horários das aulas
      </span>

      {textoAntigo && (
        <p className="gestao-dica">
          Horário cadastrado antes: “{textoAntigo}”. Escolha os dias abaixo para substituí-lo.
        </p>
      )}

      <div className="seletor-dias" role="group" aria-labelledby="horario-titulo">
        {DIAS_SEMANA.map((dia) => {
          const ativo = Boolean(selecao[dia.sigla]);
          return (
            <button
              key={dia.sigla}
              type="button"
              title={dia.nome}
              aria-pressed={ativo}
              className={`seletor-dia${ativo ? " seletor-dia-ativo" : ""}`}
              onClick={() => alternarDia(dia.sigla)}
            >
              {dia.sigla}
            </button>
          );
        })}
      </div>

      {diasEscolhidos.length > 0 && (
        <ul className="seletor-horarios">
          {diasEscolhidos.map((dia) => (
            <li key={dia.sigla}>
              <span className="seletor-horario-dia" title={dia.nome}>{dia.sigla}</span>
              <Hora
                rotulo={`${dia.nome}, início`}
                valor={selecao[dia.sigla].inicio}
                aoMudar={(hora) => mudarHora(dia.sigla, "inicio", hora)}
              />
              <span>até</span>
              <Hora
                rotulo={`${dia.nome}, término`}
                valor={selecao[dia.sigla].fim}
                aoMudar={(hora) => mudarHora(dia.sigla, "fim", hora)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
