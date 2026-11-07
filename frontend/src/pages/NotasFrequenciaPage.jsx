import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import EstadoVazio from "../components/EstadoVazio";
import FrequenciaCard from "../components/FrequenciaCard";
import Mensagem from "../components/Mensagem";
import NotasCard from "../components/NotasCard";
import Pagina from "../components/Pagina";
import { useDisciplinaAcademica } from "../hooks/useDisciplinaAcademica";
import { useDisciplinas } from "../hooks/useDisciplinas";
import { mensagemDeErro } from "../services/api";
import * as eventoService from "../services/eventoService";
import * as frequenciaService from "../services/frequenciaService";
import * as notaService from "../services/notaService";
import { formatarData, formatarNumero } from "../utils/formatacao";
import "./NotasFrequenciaPage.css";

export default function NotasFrequenciaPage() {
  const { disciplinas, carregando: carregandoLista, erroDisciplinas } = useDisciplinas();
  const [parametros, setParametros] = useSearchParams();
  const [mensagem, setMensagem] = useState(null);

  const idDoEndereco = Number(parametros.get("disciplina"));
  const selecionada =
    disciplinas.find((disciplina) => disciplina.id === idDoEndereco)?.id ?? disciplinas[0]?.id ?? null;

  const { disciplina, registros, carregando, erro, recarregar } = useDisciplinaAcademica(selecionada);

  function selecionar(id) {
    setMensagem(null);
    setParametros({ disciplina: String(id) }, { replace: true });
  }
  
  async function executar(acao, textoSucesso) {
    try {
      await acao();
      await recarregar();
      setMensagem({ texto: textoSucesso, tipo: "sucesso" });
      return true;
    } catch (falha) {
      setMensagem({ texto: mensagemDeErro(falha), tipo: "erro" });
      return false;
    }
  }

  const acoesNotas = {
    aoLancar: (avaliacao, nota) =>
      executar(
        () => notaService.lancar(avaliacao.id, nota),
        `Nota ${formatarNumero(nota)} lançada em "${avaliacao.titulo}".`
      ),
    aoRemover: (avaliacao) => {
      if (!window.confirm(`Remover a nota de "${avaliacao.titulo}"? A avaliação continua no calendário.`)) {
        return Promise.resolve(false);
      }
      return executar(() => notaService.remover(avaliacao.id), `Nota de "${avaliacao.titulo}" removida.`);
    },
    aoCriar: (dados) =>
      executar(
        () => eventoService.criar({ ...dados, disciplinaId: disciplina.id }),
        `Avaliação "${dados.titulo}" adicionada${dados.nota !== undefined ? " com nota" : ""}.`
      ),
  };

  const acoesFrequencia = {
    aoRegistrar: (registro) =>
      executar(
        () => frequenciaService.criar(disciplina.id, registro),
        registro.faltas === 0
          ? `Presença registrada em ${formatarData(registro.data)}.`
          : `Falta registrada em ${formatarData(registro.data)}.`
      ),
    aoAtualizar: (registro, dados) =>
      executar(() => frequenciaService.atualizar(registro.id, dados), "Registro de frequência atualizado."),
    aoExcluir: (registro) => {
      if (!window.confirm(`Excluir o registro de ${formatarData(registro.data)}?`)) return Promise.resolve(false);
      return executar(() => frequenciaService.remover(registro.id), "Registro de frequência excluído.");
    },
  };

  return (
    <Pagina
      titulo="Notas e frequência"
      subtitulo="Lance suas notas e registre presenças — a média e o percentual de faltas são calculados automaticamente"
    >
      <Mensagem texto={mensagem?.texto} tipo={mensagem?.tipo} aoFechar={() => setMensagem(null)} />
      <Mensagem texto={erroDisciplinas || erro} tipo="erro" />

      {carregandoLista && <p className="aviso-vazio">Carregando disciplinas...</p>}

      {!carregandoLista && !erroDisciplinas && disciplinas.length === 0 && (
        <EstadoVazio
          titulo="Cadastre uma disciplina primeiro"
          texto="As notas e a frequência são lançadas por disciplina."
          acao={{ para: "/disciplinas", rotulo: "Cadastrar disciplina" }}
        />
      )}

      {disciplinas.length > 0 && (
        <div className="seletor-disciplinas" role="group" aria-label="Escolha a disciplina">
          {disciplinas.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === selecionada}
              onClick={() => selecionar(item.id)}
            >
              {item.nome}
            </button>
          ))}
        </div>
      )}

      {carregando && !disciplina && <p className="aviso-vazio">Carregando notas e frequência...</p>}

      {disciplina && disciplina.id === selecionada && (
        <div className="notas-frequencia-colunas">
          <NotasCard disciplina={disciplina} {...acoesNotas} />
          <FrequenciaCard disciplina={disciplina} registros={registros} {...acoesFrequencia} />
        </div>
      )}
    </Pagina>
  );
}
