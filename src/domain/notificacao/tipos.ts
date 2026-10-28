export type TipoNotificacao =
  | "paciente_aguardando"
  | "retorno_reagendar"
  | "cancelamento_comunicar"
  | "estoque_abaixo_minimo"
  | "estoque_baixa_insuficiente"
  | "cadeira_indisponivel"
  | "fora_de_horario"
  | "dentista_removido"
  | "falha_envio_mensagem"
  | "atraso_protese";

export type Notificacao = {
  id: string;
  clinicaId: string;
  destinatarioId: string;
  tipo: TipoNotificacao;
  urgencia: "normal" | "critica";
  referenciaId: string;
  mensagem: string;
  lida: boolean;
  resolvida: boolean;
  criadaEm: string;
};

export type PedidoPublicacao = {
  clinicaId: string;
  tipo: TipoNotificacao;
  referenciaId: string;
  mensagem: string;
  destinatarioIds: string[];
};
