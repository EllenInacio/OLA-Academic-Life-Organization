import { plural } from "./formatacao";

export async function excluirDisciplinaComConfirmacao(
  disciplina,
  remover,
  relacionados = { eventos: 0, frequencias: 0 }
) {
  const temDados = ({ eventos = 0, frequencias = 0 }) => eventos > 0 || frequencias > 0;

  const aviso = ({ eventos = 0, frequencias = 0 }) =>
    `A disciplina "${disciplina.nome}" tem ${plural(eventos, "evento", "eventos")} no calendário ` +
    `(provas, trabalhos ou entregas, com as notas) e ${plural(frequencias, "registro", "registros")} de frequência. ` +
    "Excluir a disciplina também exclui esses dados. Esta ação não pode ser desfeita. Deseja continuar?";

  const confirmou = window.confirm(
    temDados(relacionados) ? aviso(relacionados) : `Excluir a disciplina "${disciplina.nome}"?`
  );
  if (!confirmou) return false;

  try {
    await remover(disciplina.id, temDados(relacionados));
    return true;
  } catch (erro) {
    const detalhes = erro?.response?.status === 409 && erro.response.data?.detalhes;
    if (!detalhes) throw erro;

    if (!window.confirm(aviso(detalhes))) return false;
    await remover(disciplina.id, true);
    return true;
  }
}
