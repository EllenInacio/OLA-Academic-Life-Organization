import { useCallback, useEffect, useState } from "react";
import * as disciplinaService from "../services/disciplinaService";
import * as frequenciaService from "../services/frequenciaService";
import { mensagemDeErro } from "../services/api";

export function useDisciplinaAcademica(disciplinaId) {
  const [disciplina, setDisciplina] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const recarregar = useCallback(async () => {
    if (!disciplinaId) return;
    const [detalhes, frequencias] = await Promise.all([
      disciplinaService.buscar(disciplinaId),
      frequenciaService.listar(disciplinaId),
    ]);
    setDisciplina(detalhes);
    setRegistros(frequencias);
  }, [disciplinaId]);

  useEffect(() => {
    if (!disciplinaId) return;
    setCarregando(true);
    setErro("");
    recarregar()
      .catch((falha) => setErro(mensagemDeErro(falha)))
      .finally(() => setCarregando(false));
  }, [disciplinaId, recarregar]);

  return { disciplina, registros, carregando, erro, recarregar };
}
