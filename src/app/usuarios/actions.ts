"use server";

import { revalidatePath } from "next/cache";
import { cadastrarUsuario, obterSessao, removerUsuario } from "../../domain/auth/casos";
import { estado, type EstadoFormulario } from "../formulario";
import { dependencias } from "../dependencias";
import { falha } from "../falha";
import { validarCadastro } from "./validar";

export async function cadastrar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarCadastro({
    nome: String(formData.get("nome") ?? ""),
    email: String(formData.get("email") ?? ""),
    senha: String(formData.get("senha") ?? ""),
    papel: String(formData.get("papel") ?? ""),
  });
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const deps = dependencias();
    const sessao = await obterSessao(deps);
    if (!sessao) return estado("erro", "Nenhuma sessão aberta");
    const resultado = await cadastrarUsuario(deps, sessao, validado.valor);
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/usuarios");
    return estado("sucesso", "Usuário cadastrado", resultado.valor.nome);
  } catch (erro) {
    const resultado = falha(erro);
    return estado("erro", resultado.mensagem);
  }
}

export async function remover(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const usuarioId = String(formData.get("id") ?? "");
  try {
    const deps = dependencias();
    const sessao = await obterSessao(deps);
    if (!sessao) return estado("erro", "Nenhuma sessão aberta");
    const resultado = await removerUsuario(deps, sessao, usuarioId);
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/usuarios");
    return estado("sucesso", "Acesso removido", resultado.valor.nome);
  } catch (erro) {
    const resultado = falha(erro);
    return estado("erro", resultado.mensagem);
  }
}
