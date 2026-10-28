import type { Papel } from "../auth/tipos";
import type { Notificacao, TipoNotificacao } from "./tipos";

export type UsuarioAtivo = { id: string; papel: Papel; ativo: boolean };

export type Notificacoes = {
  listar(clinicaId: string, destinatarioId: string): Promise<Notificacao[]>;
  buscarAberta(destinatarioId: string, tipo: TipoNotificacao, referenciaId: string): Promise<Notificacao | null>;
  salvar(notificacao: Notificacao): Promise<void>;
  atualizar(notificacao: Notificacao): Promise<void>;
};

export type Dependencias = {
  notificacoes: Notificacoes;
  usuarios: { listarAtivos(clinicaId: string): Promise<UsuarioAtivo[]> };
  ids: { novo(): string };
  agora(): string;
};
