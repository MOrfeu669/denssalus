import type { Dependencias, UsuarioAtivo } from "../../src/domain/notificacao/portas";
import type { Notificacao } from "../../src/domain/notificacao/tipos";

export const AGORA_NOTIFICACAO = "2026-10-28T12:00:00.000Z";

// Dublê que nunca lança e não guarda nada: para testes que não olham notificação.
export function notificacoesVazias(): Dependencias {
  return {
    notificacoes: {
      listar: async () => [],
      buscarAberta: async () => null,
      salvar: async () => {},
      atualizar: async () => {},
    },
    usuarios: { listarAtivos: async () => [] },
    ids: { novo: () => "notificacao-fixa" },
    agora: () => AGORA_NOTIFICACAO,
  };
}

// Dublê em memória: guarda as linhas e usa a lista de usuários recebida.
export class NotificacoesMemoria {
  linhas: Notificacao[] = [];
  usuarios: UsuarioAtivo[] = [];
  private proximo = 0;

  deps(): Dependencias {
    return {
      notificacoes: {
        listar: async (clinicaId, destinatarioId) =>
          this.linhas.filter(
            (item) => item.clinicaId === clinicaId && item.destinatarioId === destinatarioId,
          ),
        buscarAberta: async (destinatarioId, tipo, referenciaId) =>
          this.linhas.find(
            (item) =>
              item.destinatarioId === destinatarioId &&
              item.tipo === tipo &&
              item.referenciaId === referenciaId &&
              !item.resolvida,
          ) ?? null,
        salvar: async (notificacao) => {
          this.linhas.push(notificacao);
        },
        atualizar: async (notificacao) => {
          this.linhas = this.linhas.map((item) =>
            item.id === notificacao.id ? notificacao : item,
          );
        },
      },
      usuarios: { listarAtivos: async () => this.usuarios.filter((item) => item.ativo) },
      ids: { novo: () => `notificacao-${++this.proximo}` },
      agora: () => AGORA_NOTIFICACAO,
    };
  }

  doDestinatario(destinatarioId: string): Notificacao[] {
    return this.linhas.filter((item) => item.destinatarioId === destinatarioId);
  }
}
