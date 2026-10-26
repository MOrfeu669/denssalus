import type { Clinicas } from "../clinica/portas";
import type { Procedimento } from "./tipos";

export type Procedimentos = {
  listar(clinicaId: string): Promise<Procedimento[]>;
  buscarPorId(id: string): Promise<Procedimento | null>;
  salvar(procedimento: Procedimento): Promise<void>;
  remover(id: string): Promise<void>;
};

export type Dependencias = {
  procedimentos: Procedimentos;
  clinicas: Pick<Clinicas, "buscarPorId">;
  ids: { novo(): string };
};
