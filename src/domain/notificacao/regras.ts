import type { UsuarioAtivo } from "./portas";
import type { Notificacao, TipoNotificacao } from "./tipos";

export const MENSAGEM_PACIENTE_AGUARDANDO = "Paciente aguardando atendimento";
export const MENSAGEM_CANCELAMENTO_COMUNICAR = "Comunicar o paciente sobre o cancelamento";

const NORMAIS: TipoNotificacao[] = ["paciente_aguardando", "cancelamento_comunicar"];
const DA_RECEPCAO: TipoNotificacao[] = [
  "retorno_reagendar",
  "cancelamento_comunicar",
  "falha_envio_mensagem",
];

export function urgenciaDe(tipo: TipoNotificacao): Notificacao["urgencia"] {
  return NORMAIS.includes(tipo) ? "normal" : "critica";
}

export function destinatarios(
  usuarios: UsuarioAtivo[],
  tipo: TipoNotificacao,
  dentistaUsuarioId?: string,
): string[] {
  const ativos = usuarios.filter((usuario) => usuario.ativo === true);

  if (tipo === "paciente_aguardando") {
    return dentistaUsuarioId ? [dentistaUsuarioId] : [];
  }

  if (DA_RECEPCAO.includes(tipo)) {
    const recepcionistas = ativos.filter((usuario) => usuario.papel === "recepcionista");
    const escolhidos = recepcionistas.length > 0 ? recepcionistas : ativos.filter((u) => u.papel === "admin");
    return escolhidos.map((usuario) => usuario.id);
  }

  return ativos.map((usuario) => usuario.id);
}

export function visivel(notificacao: Notificacao): boolean {
  return !notificacao.resolvida && (notificacao.urgencia === "critica" || !notificacao.lida);
}
