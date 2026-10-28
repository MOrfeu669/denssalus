import type { ArquivosImagem, Imagens } from "../../domain/imagem/portas";
import type { ImagemProntuario } from "../../domain/imagem/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

const BUCKET = "prontuario-imagens";
const TABELA = "imagens_prontuario";
const SEGUNDOS_PADRAO = 3600;

type LinhaImagem = {
  id: string;
  clinica_id: string;
  paciente_id: string;
  agendamento_id: string | null;
  dente: number | null;
  tipo_caso: string;
  descricao: string;
  caminho: string;
  tamanho_bytes: number;
  adicionado_por: string;
  adicionado_em: string;
  excluido_em: string | null;
  remocao_definitiva_em: string | null;
};

function iso(valor: string | null): string | null {
  return valor === null ? null : new Date(valor).toISOString();
}

function paraImagem(linha: LinhaImagem): ImagemProntuario {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    pacienteId: linha.paciente_id,
    agendamentoId: linha.agendamento_id,
    dente: linha.dente,
    tipoCaso: linha.tipo_caso,
    descricao: linha.descricao,
    caminho: linha.caminho,
    tamanhoBytes: linha.tamanho_bytes,
    adicionadoPor: linha.adicionado_por,
    adicionadoEm: new Date(linha.adicionado_em).toISOString(),
    excluidoEm: iso(linha.excluido_em),
    remocaoDefinitivaEm: iso(linha.remocao_definitiva_em),
  };
}

function paraLinha(imagem: ImagemProntuario): LinhaImagem {
  return {
    id: imagem.id,
    clinica_id: imagem.clinicaId,
    paciente_id: imagem.pacienteId,
    agendamento_id: imagem.agendamentoId,
    dente: imagem.dente,
    tipo_caso: imagem.tipoCaso,
    descricao: imagem.descricao,
    caminho: imagem.caminho,
    tamanho_bytes: imagem.tamanhoBytes,
    adicionado_por: imagem.adicionadoPor,
    adicionado_em: imagem.adicionadoEm,
    excluido_em: imagem.excluidoEm,
    remocao_definitiva_em: imagem.remocaoDefinitivaEm,
  };
}

export type ArquivosImagemStorage = ArquivosImagem & {
  urlDeUpload(caminho: string): Promise<{ url: string; token: string }>;
  urlDeLeitura(caminho: string, segundos?: number): Promise<string>;
};

export function criarImagens(): { imagens: Imagens; arquivos: ArquivosImagemStorage } {
  const admin = createAdminClient();

  const imagens: Imagens = {
    async listarPorPaciente(clinicaId, pacienteId) {
      const { data, error } = await admin
        .from(TABELA)
        .select("*")
        .eq("clinica_id", clinicaId)
        .eq("paciente_id", pacienteId);
      if (error) throw new ErroAplicacao("Não foi possível listar as imagens", error);
      return (data as LinhaImagem[]).map(paraImagem);
    },

    async buscarPorId(id) {
      const { data, error } = await admin.from(TABELA).select("*").eq("id", id).maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler a imagem", error);
      return data ? paraImagem(data as LinhaImagem) : null;
    },

    async salvar(imagem) {
      const { error } = await admin.from(TABELA).upsert(paraLinha(imagem));
      if (error) throw new ErroAplicacao("Não foi possível salvar a imagem", error);
    },

    async apagar(id) {
      const { error } = await admin.from(TABELA).delete().eq("id", id);
      if (error) throw new ErroAplicacao("Não foi possível apagar a imagem", error);
    },
  };

  const arquivos: ArquivosImagemStorage = {
    async remover(caminho) {
      const { error } = await admin.storage.from(BUCKET).remove([caminho]);
      if (error) throw new ErroAplicacao("Não foi possível remover o arquivo", error);
    },

    async urlDeUpload(caminho) {
      const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(caminho);
      if (error) throw new ErroAplicacao("Não foi possível preparar o envio do arquivo", error);
      return { url: data.signedUrl, token: data.token };
    },

    async urlDeLeitura(caminho, segundos = SEGUNDOS_PADRAO) {
      const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(caminho, segundos);
      if (error) throw new ErroAplicacao("Não foi possível abrir o arquivo", error);
      return data.signedUrl;
    },
  };

  return { imagens, arquivos };
}
