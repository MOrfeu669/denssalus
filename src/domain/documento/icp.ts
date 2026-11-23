import type { PedidoAssinatura, ProvedorAssinatura } from "./portas";

export type ConfigIcpBrasil = {
  url: string;
  credencial: string;
  certificadoA1Base64: string;
  senhaCertificado: string;
};

const CHAVES = [
  "ICP_BRASIL_URL",
  "ICP_BRASIL_CREDENCIAL",
  "ICP_BRASIL_CERTIFICADO_A1_BASE64",
  "ICP_BRASIL_CERTIFICADO_SENHA",
] as const;

export function lerConfigIcpBrasil(env: Record<string, string | undefined>): ConfigIcpBrasil | null {
  const valores = CHAVES.map((chave) => env[chave]?.trim() ?? "");
  if (valores.some((valor) => valor === "")) return null;
  return {
    url: valores[0],
    credencial: valores[1],
    certificadoA1Base64: valores[2],
    senhaCertificado: valores[3],
  };
}

// O corpo é o contrato deste adaptador. A URL e a credencial vêm do ambiente; nenhum provedor está fixo no código.
export function criarProvedorIcpBrasil(
  config: ConfigIcpBrasil,
  enviar: typeof fetch,
): ProvedorAssinatura {
  return {
    configurado: () => true,
    async assinar(pedido: PedidoAssinatura) {
      const resposta = await enviar(config.url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${config.credencial}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          conteudo: pedido.conteudo,
          documentoId: pedido.documentoId,
          cro: pedido.dentista.cro,
          certificadoA1Base64: config.certificadoA1Base64,
        }),
      });
      if (!resposta.ok) throw new Error("Falha ao assinar com ICP-Brasil");
      const corpo = (await resposta.json()) as { assinatura?: unknown };
      if (typeof corpo.assinatura !== "string" || corpo.assinatura === "") {
        throw new Error("Assinatura ICP-Brasil ausente");
      }
      return corpo.assinatura;
    },
  };
}

export function provedorDesligado(): ProvedorAssinatura {
  return {
    configurado: () => false,
    assinar: async () => {
      throw new Error("Provedor de assinatura não configurado");
    },
  };
}
