import type { Papel, Usuario } from "./tipos";

export type Credenciais =
  | { ok: true; userId: string }
  | { ok: false };

export type NovoAcesso = {
  email: string;
  senha: string;
  nome: string;
  papel: Papel;
  clinicaId: string;
};

export type AuthGateway = {
  autenticar(email: string, senha: string): Promise<Credenciais>;
  criarAcesso(entrada: NovoAcesso): Promise<{ id: string }>;
  revogarAcesso(userId: string): Promise<void>;
  enviarRecuperacao(email: string, redirectTo: string): Promise<void>;
  usuarioAtual(): Promise<string | null>;
  definirSenha(senha: string): Promise<void>;
  encerrarSessao(): Promise<void>;
};

export type Usuarios = {
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  salvar(usuario: Usuario): Promise<void>;
  apagar(id: string): Promise<void>;
  listarDaClinica(clinicaId: string): Promise<Usuario[]>;
};

export type Dependencias = {
  auth: AuthGateway;
  usuarios: Usuarios;
};
