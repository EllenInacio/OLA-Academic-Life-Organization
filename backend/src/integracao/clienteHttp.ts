export type RespostaHttp = {
  status: number;
  headers: Headers;
  corpo: any;
};

type Opcoes = {
  cabecalhos?: Record<string, string>;
  corpo?: unknown;
};

export function criarClienteHttp(baseUrl: string) {
  async function enviar(metodo: string, caminho: string, opcoes: Opcoes = {}): Promise<RespostaHttp> {
    const cabecalhos: Record<string, string> = { ...opcoes.cabecalhos };

    if (opcoes.corpo !== undefined) {
      cabecalhos["Content-Type"] = "application/json";
    }

    const resposta = await fetch(`${baseUrl}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
    });

    const texto = await resposta.text();

    return {
      status: resposta.status,
      headers: resposta.headers,
      corpo: texto ? JSON.parse(texto) : null,
    };
  }

  return {
    get: (caminho: string, cabecalhos?: Record<string, string>) =>
      enviar("GET", caminho, { cabecalhos }),
    post: (caminho: string, corpo: unknown, cabecalhos?: Record<string, string>) =>
      enviar("POST", caminho, { corpo, cabecalhos }),
    put: (caminho: string, corpo: unknown, cabecalhos?: Record<string, string>) =>
      enviar("PUT", caminho, { corpo, cabecalhos }),
    delete: (caminho: string, cabecalhos?: Record<string, string>) =>
      enviar("DELETE", caminho, { cabecalhos }),
  };
}
