import type { Dentistas } from "../dentista/portas";
import type { Pacientes } from "../paciente/portas";
import type { Auditoria } from "../prontuario/portas";
import type { DocumentoGerado, ModeloDocumento } from "./tipos";

export type ModelosDocumento = {
  listar(clinicaId: string): Promise<ModeloDocumento[]>;
  buscarPorId(id: string): Promise<ModeloDocumento | null>;
  salvar(modelo: ModeloDocumento): Promise<void>;
};

// Sem delete: correção é insert com id novo. O legado em bytea ganha caminho e o pdf zera.
export type DocumentosGerados = {
  listarPorPaciente(clinicaId: string, pacienteId: string): Promise<DocumentoGerado[]>;
  listarLegados(clinicaId: string): Promise<DocumentoGerado[]>;
  buscarPorId(id: string): Promise<DocumentoGerado | null>;
  salvar(documento: DocumentoGerado): Promise<void>;
  registrarCaminho(clinicaId: string, documentoId: string, caminho: string): Promise<void>;
};

export type PedidoAssinatura = {
  conteudo: string;
  documentoId: string;
  dentista: { id: string; nome: string; cro: string };
  instante: string;
};

export type ProvedorAssinatura = {
  configurado(): boolean;
  assinar(pedido: PedidoAssinatura): Promise<string>;
};

export type ArquivosDocumento = {
  guardar(clinicaId: string, documentoId: string, bytes: Uint8Array): Promise<string>;
  urlAssinada(clinicaId: string, caminho: string): Promise<string>;
};

export type ImportacoesModelo = {
  registrar(modeloId: string, usuarioId: string): Promise<void>;
  listarPorUsuario(usuarioId: string): Promise<string[]>;
};

export type Dependencias = {
  modelos: ModelosDocumento;
  documentos: DocumentosGerados;
  importacoes: ImportacoesModelo;
  pacientes: Pick<Pacientes, "buscarPorId">;
  dentistas: Pick<Dentistas, "listar">;
  auditoria: Auditoria;
  assinatura: ProvedorAssinatura;
  arquivos: ArquivosDocumento;
  ids: { novo(): string };
};
