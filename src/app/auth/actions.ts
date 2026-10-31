"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { definirNovaSenha, login, solicitarRecuperacao } from "../../domain/auth/casos";
import { MENSAGEM_CREDENCIAIS } from "../../domain/auth/tipos";
import { estado, type EstadoFormulario } from "../formulario";
import { dependencias } from "../dependencias";
import { falha } from "../falha";
import { DETALHE_CREDENCIAIS, detalheSessaoAberta } from "../login/texto";

async function origem(): Promise<string> {
  const cabecalhos = await headers();
  const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host") ?? "127.0.0.1:3000";
  const proto = cabecalhos.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function entrar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = String(formData.get("email") ?? "");
  const senha = String(formData.get("senha") ?? "");
  try {
    const resultado = await login(dependencias(), email, senha);
    if (!resultado.ok) {
      return estado(
        "erro",
        resultado.mensagem,
        resultado.mensagem === MENSAGEM_CREDENCIAIS ? DETALHE_CREDENCIAIS : "",
      );
    }
    const { nome, papel } = resultado.valor.usuario;
    return estado("sucesso", "Sessão aberta", detalheSessaoAberta(nome, papel));
  } catch (erro) {
    const resultado = falha(erro);
    return estado("erro", resultado.mensagem);
  }
}

export async function pedirRecuperacao(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return estado("erro", "Informe o e-mail");
  try {
    const redirectTo = `${await origem()}/auth/callback`;
    const resultado = await solicitarRecuperacao(dependencias(), email, redirectTo);
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    return estado("sucesso", "Enviamos um e-mail com o link de redefinição");
  } catch (erro) {
    const resultado = falha(erro);
    return estado("erro", resultado.mensagem);
  }
}

export async function definirSenha(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const senha = String(formData.get("senha") ?? "");
  if (senha.length < 6) {
    return estado("erro", "A senha precisa ter pelo menos 6 caracteres");
  }
  try {
    const resultado = await definirNovaSenha(dependencias(), senha);
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    return estado("sucesso", "Senha redefinida");
  } catch (erro) {
    const resultado = falha(erro);
    return estado("erro", resultado.mensagem);
  }
}

export async function sair(): Promise<void> {
  try {
    await dependencias().auth.encerrarSessao();
  } catch (erro) {
    falha(erro);
    return;
  }
  redirect("/login");
}
