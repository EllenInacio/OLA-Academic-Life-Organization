import { useState } from "react";
import CalendarioMensal from "../components/CalendarioMensal";
import DisciplinaForm from "../components/DisciplinaForm";
import EventoForm from "../components/EventoForm";
import EventoLista from "../components/EventoLista";
import Mensagem from "../components/Mensagem";
import { useDisciplinas } from "../hooks/useDisciplinas";
import { useEventos } from "../hooks/useEventos";
import { mensagemDeErro } from "../services/api";

export default function CalendarioPage() {
  const { disciplinas, erroDisciplinas, criarDisciplina } = useDisciplinas();
  const {
    eventos,
    carregando,
    erroEventos,
    criarEvento,
    atualizarEvento,
    removerEvento,
  } = useEventos();

  const [eventoEmEdicao, setEventoEmEdicao] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  async function salvarDisciplina(dados) {
    try {
      await criarDisciplina(dados);
      setMensagem({
        texto: "Disciplina cadastrada com sucesso.",
        tipo: "sucesso",
      });
      return true;
    } catch (erro) {
      setMensagem({ texto: mensagemDeErro(erro), tipo: "erro" });
      return false;
    }
  }

  async function salvarEvento(dados) {
    try {
      if (eventoEmEdicao) {
        await atualizarEvento(eventoEmEdicao.id, dados);
        setMensagem({
          texto: "Evento atualizado com sucesso.",
          tipo: "sucesso",
        });
        setEventoEmEdicao(null);
      } else {
        await criarEvento(dados);
        setMensagem({
          texto: "Evento cadastrado com sucesso.",
          tipo: "sucesso",
        });
      }
      return true;
    } catch (erro) {
      setMensagem({ texto: mensagemDeErro(erro), tipo: "erro" });
      return false;
    }
  }

  async function excluirEvento(evento) {
    if (!window.confirm(`Excluir "${evento.titulo}"?`)) {
      return;
    }

    try {
      await removerEvento(evento.id);
      if (eventoEmEdicao?.id === evento.id) {
        setEventoEmEdicao(null);
      }
      setMensagem({ texto: "Evento excluído.", tipo: "sucesso" });
    } catch (erro) {
      setMensagem({ texto: mensagemDeErro(erro), tipo: "erro" });
    }
  }

  return (
    <>
      <Mensagem
        texto={mensagem?.texto}
        tipo={mensagem?.tipo}
        aoFechar={() => setMensagem(null)}
      />
      <Mensagem texto={erroEventos || erroDisciplinas} tipo="erro" />

      <CalendarioMensal eventos={eventos} />

      <div className="colunas">
        <section>
          <DisciplinaForm aoSalvar={salvarDisciplina} />
          <EventoForm
            disciplinas={disciplinas}
            eventoEmEdicao={eventoEmEdicao}
            aoSalvar={salvarEvento}
            aoCancelar={() => setEventoEmEdicao(null)}
          />
        </section>

        <section>
          <h2 className="titulo-lista">Calendário de provas e trabalhos</h2>
          <EventoLista
            eventos={eventos}
            carregando={carregando}
            aoEditar={setEventoEmEdicao}
            aoExcluir={excluirEvento}
          />
        </section>
      </div>
    </>
  );
}
