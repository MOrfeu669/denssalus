import { permite } from "./permissao";
import type { Dependencias } from "./portas";
import {
  MENSAGEM_CREDENCIAIS,
  MENSAGEM_PAPEL,
  type Acao,
  type Papel,
  type Resultado,
  type Sessao,
  type Usuario,
} from "./tipos";

export function autorizarAcao(ator: Sessao, acao: Acao): Resultado<void> {
  if (!ator.usuario.ativo || !permite(ator.usuario.papel, acao)) {
    return { ok: false, mensagem: MENSAGEM_PAPEL };
  }
  return { ok: true, valor: undefined };
}

export function autorizarLeituraDaClinica(ator: Sessao, clinicaId: string): Resultado<void> {
  if (!ator.usuario.ativo || ator.usuario.clinicaId !== clinicaId) {
    return { ok: false, mensagem: "Acesso bloqueado" };
  }
  return { ok: true, valor: undefined };
}

export async function obterSessao(deps: Dependencias): Promise<Sessao | null> {
  const userId = await deps.auth.usuarioAtual();
  if (!userId) return null;
  const usuario = await deps.usuarios.buscarPorId(userId);
  if (!usuario?.ativo) return null;
  return { usuario };
}

export async function login(
  deps: Dependencias,
  email: string,
  senha: string,
): Promise<Resultado<Sessao>> {
  const credenciais = await deps.auth.autenticar(email.trim().toLowerCase(), senha);
  if (!credenciais.ok) return { ok: false, mensagem: MENSAGEM_CREDENCIAIS };
  const usuario = await deps.usuarios.buscarPorId(credenciais.userId);
  if (!usuario?.ativo) {
    await deps.auth.encerrarSessao();
    return { ok: false, mensagem: MENSAGEM_CREDENCIAIS };
  }
  return { ok: true, valor: { usuario } };
}

export async function cadastrarUsuario(
  deps: Dependencias,
  ator: Sessao,
  entrada: { nome: string; email: string; senha: string; papel: Papel },
): Promise<Resultado<Usuario>> {
  const permitido = autorizarAcao(ator, "usuario:cadastrar");
  if (!permitido.ok) return permitido;
  if (entrada.papel === "admin") return { ok: false, mensagem: MENSAGEM_PAPEL };

  const email = entrada.email.trim().toLowerCase();
  const existente = await deps.usuarios.buscarPorEmail(email);
  if (existente) return { ok: false, mensagem: "E-mail já cadastrado" };

  const { id } = await deps.auth.criarAcesso({
    email,
    senha: entrada.senha,
    nome: entrada.nome.trim(),
    papel: entrada.papel,
    clinicaId: ator.usuario.clinicaId,
  });
  const usuario: Usuario = {
    id,
    nome: entrada.nome.trim(),
    email,
    papel: entrada.papel,
    clinicaId: ator.usuario.clinicaId,
    ativo: true,
  };
  try {
    await deps.usuarios.salvar(usuario);
  } catch (erro) {
    await deps.auth.revogarAcesso(id);
    throw erro;
  }
  return { ok: true, valor: usuario };
}

export async function removerUsuario(
  deps: Dependencias,
  ator: Sessao,
  usuarioId: string,
): Promise<Resultado<Usuario>> {
  const permitido = autorizarAcao(ator, "usuario:remover");
  if (!permitido.ok) return permitido;

  const usuario = await deps.usuarios.buscarPorId(usuarioId);
  if (!usuario || usuario.clinicaId !== ator.usuario.clinicaId) {
    return { ok: false, mensagem: "Usuário não encontrado" };
  }
  if (usuario.papel === "admin") return { ok: false, mensagem: MENSAGEM_PAPEL };

  const inativo: Usuario = { ...usuario, ativo: false };
  await deps.usuarios.salvar(inativo);
  await deps.auth.revogarAcesso(usuario.id);
  return { ok: true, valor: inativo };
}

export async function listarUsuarios(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<Usuario[]>> {
  const permitido = autorizarAcao(ator, "usuario:cadastrar");
  if (!permitido.ok) return permitido;
  const lista = await deps.usuarios.listarDaClinica(ator.usuario.clinicaId);
  return { ok: true, valor: lista };
}

export async function solicitarRecuperacao(
  deps: Dependencias,
  email: string,
  redirectTo: string,
): Promise<Resultado<void>> {
  await deps.auth.enviarRecuperacao(email.trim().toLowerCase(), redirectTo);
  return { ok: true, valor: undefined };
}

export async function definirNovaSenha(
  deps: Dependencias,
  senha: string,
): Promise<Resultado<void>> {
  const userId = await deps.auth.usuarioAtual();
  if (!userId) return { ok: false, mensagem: MENSAGEM_CREDENCIAIS };
  await deps.auth.definirSenha(senha);
  return { ok: true, valor: undefined };
}
