import type { EtapaProtese, StatusProtese } from "../../../domain/protese/tipos";

export type ResponsavelOpcao = { id: string; nome: string };

export const ETAPA_PROTESE: Record<EtapaProtese, string> = {
  pre_envio: "Pré-envio",
  envio_acompanhamento: "Envio e acompanhamento",
  recebimento_conferencia: "Recebimento e conferência",
  instalacao: "Instalação",
};

export const STATUS_PROTESE: Record<StatusProtese, string> = {
  em_andamento: "Em andamento",
  concluida: "Concluída",
  descontinuada: "Descontinuada",
};
