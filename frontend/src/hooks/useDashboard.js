import { useCallback, useEffect, useState } from "react";
import * as dashboardService from "../services/dashboardService";
import { mensagemDeErro } from "../services/api";

export function useDashboard() {
  const [painel, setPainel] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setPainel(await dashboardService.obter());
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { painel, carregando, erro, recarregar: carregar };
}
