import type { Agendamentos } from "../agendamento/portas";
import type { Pacientes } from "../paciente/portas";
import type { ImagemProntuario } from "./tipos";

export type Imagens = {
  listarPorPaciente(clinicaId: string, pacienteId: string): Promise<ImagemProntuario[]>;
  buscarPorId(id: string): Promise<ImagemProntuario | null>;
  salvar(imagem: ImagemProntuario): Promise<void>;
  apagar(id: string): Promise<void>;
};

export type ArquivosImagem = {
  remover(caminho: string): Promise<void>;
};

export type Dependencias = {
  imagens: Imagens;
  arquivos: ArquivosImagem;
  pacientes: Pick<Pacientes, "buscarPorId">;
  agendamentos: Pick<Agendamentos, "buscarPorId">;
  ids: { novo(): string };
};
