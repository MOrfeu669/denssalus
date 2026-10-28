import type { Dentistas } from "../dentista/portas";
import type { Pacientes } from "../paciente/portas";
import type { Auditoria } from "../prontuario/portas";
import type { DocumentoGerado, ModeloDocumento } from "./tipos";

export type ModelosDocumento = {
  listar(clinicaId: string): Promise<ModeloDocumento[]>;
  buscarPorId(id: string): Promise<ModeloDocumento | null>;
  salvar(modelo: ModeloDocumento): Promise<void>;
};

// Sem update nem delete: correção é insert com id novo.
export type DocumentosGerados = {
  listarPorPaciente(clinicaId: string, pacienteId: string): Promise<DocumentoGerado[]>;
  buscarPorId(id: string): Promise<DocumentoGerado | null>;
  salvar(documento: DocumentoGerado): Promise<void>;
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
  ids: { novo(): string };
};
