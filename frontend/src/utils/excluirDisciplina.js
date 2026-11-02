import { plural } from "./formatacao";

/**
 * Pede confirmação antes de excluir uma disciplina. Se ela tiver eventos no
 * calendário, avisa que eles serão excluídos junto. Se a API recusar (409) porque
 * surgiram eventos depois que a tela foi carregada, pergunta de novo com o número real.
 * Retorna true quando a disciplina foi excluída.
 */
export async function excluirDisciplinaComConfirmacao(disciplina, remover, totalEventos = 0) {
  const aviso = (eventos) =>
    `A disciplina "${disciplina.nome}" tem ${plural(eventos, "evento", "eventos")} no calendário ` +
    "(provas, trabalhos ou entregas). Excluir a disciplina também exclui esses eventos. " +
    "Esta ação não pode ser desfeita. Deseja continuar?";

  const confirmou = window.confirm(
    totalEventos > 0 ? aviso(totalEventos) : `Excluir a disciplina "${disciplina.nome}"?`
  );
  if (!confirmou) return false;

  try {
    await remover(disciplina.id, totalEventos > 0);
    return true;
  } catch (erro) {
    const eventos = erro?.response?.status === 409 && erro.response.data?.detalhes?.eventos;
    if (!eventos) throw erro;

    if (!window.confirm(aviso(eventos))) return false;
    await remover(disciplina.id, true);
    return true;
  }
}
