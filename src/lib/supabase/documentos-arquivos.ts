import type { ArquivosDocumento } from "../../domain/documento/portas";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

const BALDE = "documentos";
const SEGUNDOS = 60;

export function caminhoDoDocumento(clinicaId: string, documentoId: string): string {
  return `${clinicaId}/${documentoId}.pdf`;
}

export function caminhoPermitido(clinicaId: string, caminho: string): boolean {
  return caminho.startsWith(`${clinicaId}/`) && !caminho.includes("..") && !caminho.includes("//");
}

export function criarArquivosDocumento(): ArquivosDocumento {
  const admin = createAdminClient();

  return {
    async guardar(clinicaId, documentoId, bytes) {
      const caminho = caminhoDoDocumento(clinicaId, documentoId);
      const { error } = await admin.storage.from(BALDE).upload(caminho, Buffer.from(bytes), {
        contentType: "application/pdf",
        upsert: false,
      });
      if (error) throw new ErroAplicacao("Não foi possível guardar o PDF", error);
      return caminho;
    },

    async urlAssinada(clinicaId, caminho) {
      if (!caminhoPermitido(clinicaId, caminho)) {
        throw new ErroAplicacao("Caminho de documento inválido");
      }
      const { data, error } = await admin.storage.from(BALDE).createSignedUrl(caminho, SEGUNDOS);
      if (error || !data?.signedUrl) throw new ErroAplicacao("Não foi possível assinar a URL do PDF", error);
      return data.signedUrl;
    },
  };
}
