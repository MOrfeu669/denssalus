import type {
  DocumentosGerados,
  ImportacoesModelo,
  ModelosDocumento,
} from "../../domain/documento/portas";
import type { DocumentoGerado, ModeloDocumento, TipoModelo } from "../../domain/documento/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type LinhaModelo = {
  id: string;
  clinica_id: string;
  criado_por: string | null;
  compartilhado: boolean;
  nome: string;
  tipo: string;
  conteudo: string;
};

type LinhaDocumento = {
  id: string;
  clinica_id: string;
  modelo_id: string;
  paciente_id: string;
  anterior_id: string | null;
  conteudo_final: string;
  pdf: unknown;
  assinatura: string;
  gerado_por: string;
  gerado_em: string;
};

type LinhaImportacao = {
  modelo_id: string;
  usuario_id: string;
};

function hexParaBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function paraBytes(valor: unknown): Uint8Array {
  if (valor instanceof Uint8Array) return new Uint8Array(valor);
  if (typeof valor === "string") {
    if (valor.startsWith("\\x")) return hexParaBytes(valor.slice(2));
    return new Uint8Array(Buffer.from(valor, "base64"));
  }
  if (valor && typeof valor === "object" && "data" in valor && Array.isArray(valor.data)) {
    return Uint8Array.from(valor.data as number[]);
  }
  throw new ErroAplicacao("Formato de PDF não reconhecido");
}

// PostgREST persiste bytea a partir da representação hex `\x...` em JSON.
// Um Buffer serializaria como { type, data } e não seria aceito pela coluna.
function paraHex(bytes: Uint8Array): string {
  return `\\x${Buffer.from(bytes).toString("hex")}`;
}

function paraModelo(linha: LinhaModelo): ModeloDocumento {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    criadoPor: linha.criado_por,
    compartilhado: linha.compartilhado,
    nome: linha.nome,
    tipo: linha.tipo as TipoModelo,
    conteudo: linha.conteudo,
  };
}

function paraLinhaModelo(modelo: ModeloDocumento): LinhaModelo {
  return {
    id: modelo.id,
    clinica_id: modelo.clinicaId,
    criado_por: modelo.criadoPor,
    compartilhado: modelo.compartilhado,
    nome: modelo.nome,
    tipo: modelo.tipo,
    conteudo: modelo.conteudo,
  };
}

function paraDocumento(linha: LinhaDocumento): DocumentoGerado {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    modeloId: linha.modelo_id,
    pacienteId: linha.paciente_id,
    anteriorId: linha.anterior_id,
    conteudoFinal: linha.conteudo_final,
    pdf: paraBytes(linha.pdf),
    assinatura: linha.assinatura,
    geradoPor: linha.gerado_por,
    geradoEm: new Date(linha.gerado_em).toISOString(),
  };
}

function paraLinhaDocumento(documento: DocumentoGerado): LinhaDocumento {
  return {
    id: documento.id,
    clinica_id: documento.clinicaId,
    modelo_id: documento.modeloId,
    paciente_id: documento.pacienteId,
    anterior_id: documento.anteriorId,
    conteudo_final: documento.conteudoFinal,
    pdf: paraHex(documento.pdf),
    assinatura: documento.assinatura,
    gerado_por: documento.geradoPor,
    gerado_em: documento.geradoEm,
  };
}

export function criarDocumentos(): {
  modelos: ModelosDocumento;
  documentos: DocumentosGerados;
  importacoes: ImportacoesModelo;
} {
  const admin = createAdminClient();

  const modelos: ModelosDocumento = {
    async listar(clinicaId) {
      const { data, error } = await admin
        .from("modelos_documento")
        .select("*")
        .eq("clinica_id", clinicaId);
      if (error) throw new ErroAplicacao("Não foi possível listar os modelos", error);
      return (data as LinhaModelo[]).map(paraModelo);
    },

    async buscarPorId(id) {
      const { data, error } = await admin
        .from("modelos_documento")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o modelo", error);
      return data ? paraModelo(data as LinhaModelo) : null;
    },

    async salvar(modelo) {
      const { error } = await admin.from("modelos_documento").insert(paraLinhaModelo(modelo));
      if (error) throw new ErroAplicacao("Não foi possível salvar o modelo", error);
    },
  };

  const documentos: DocumentosGerados = {
    async listarPorPaciente(clinicaId, pacienteId) {
      const { data, error } = await admin
        .from("documentos_gerados")
        .select("*")
        .eq("clinica_id", clinicaId)
        .eq("paciente_id", pacienteId);
      if (error) throw new ErroAplicacao("Não foi possível listar os documentos", error);
      return (data as LinhaDocumento[]).map(paraDocumento);
    },

    async buscarPorId(id) {
      const { data, error } = await admin
        .from("documentos_gerados")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o documento", error);
      return data ? paraDocumento(data as LinhaDocumento) : null;
    },

    async salvar(documento) {
      const { error } = await admin
        .from("documentos_gerados")
        .insert(paraLinhaDocumento(documento));
      if (error) throw new ErroAplicacao("Não foi possível salvar o documento", error);
    },
  };

  const importacoes: ImportacoesModelo = {
    async registrar(modeloId, usuarioId) {
      const linha: LinhaImportacao = { modelo_id: modeloId, usuario_id: usuarioId };
      const { error } = await admin.from("modelos_importados").insert(linha);
      if (error) throw new ErroAplicacao("Não foi possível registrar a importação", error);
    },

    async listarPorUsuario(usuarioId) {
      const { data, error } = await admin
        .from("modelos_importados")
        .select("modelo_id")
        .eq("usuario_id", usuarioId);
      if (error) throw new ErroAplicacao("Não foi possível listar as importações", error);
      return (data as Pick<LinhaImportacao, "modelo_id">[]).map((linha) => linha.modelo_id);
    },
  };

  return { modelos, documentos, importacoes };
}
