export const TIPOS_MENSAGEM = [
  "confirmacao_agendamento",
  "lembrete_24h",
  "lembrete_5h",
] as const;

export type TipoMensagem = (typeof TIPOS_MENSAGEM)[number];

export type StatusEnvio = "pendente" | "enviado" | "falhou";

export type CanalMensagem = "sms" | "email" | "whatsapp";

export type MensagemExterna = {
  id: string;
  clinicaId: string;
  pacienteId: string;
  agendamentoId: string;
  tipo: TipoMensagem;
  canal: CanalMensagem;
  contato: string;
  texto: string;
  status: StatusEnvio;
  tentativas: number;
  programadoPara: string;
  enviadoEm: string | null;
};

export type ModeloMensagem = {
  clinicaId: string;
  tipo: TipoMensagem;
  conteudo: string;
};

export const MENSAGEM_CONTEUDO_VAZIO = "Informe o conteúdo da mensagem";
export const MENSAGEM_FALHA_ENVIO = "Falha no envio da mensagem ao paciente";
