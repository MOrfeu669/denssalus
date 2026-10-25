"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../domain/auth/casos";
import {
  adicionarCadeira,
  configurarFuncionamento,
  criarClinica,
  desativarCadeira,
} from "../../domain/clinica/casos";
import { dependencias, dependenciasClinica } from "../dependencias";
import { falha } from "../falha";
import { estado, type EstadoFormulario } from "../formulario";
import { validarCriacao, validarFuncionamento } from "./validar";

const SEM_SESSAO = "Nenhuma sessão aberta";

export async function criar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarCriacao({
    nome: String(formData.get("nome") ?? ""),
    dias: formData.getAll("dias").map(String),
    abertura: String(formData.get("abertura") ?? ""),
    fechamento: String(formData.get("fechamento") ?? ""),
    cadeiras: String(formData.get("cadeiras") ?? ""),
  });
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await criarClinica(dependenciasClinica(), sessao, validado.valor);
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/clinica");
    return estado("sucesso", "Clínica criada", resultado.valor.clinica.nome);
  } catch (erro) {
    return estado("erro", falha(erro).mensagem);
  }
}

export async function salvarHorario(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarFuncionamento({
    dias: formData.getAll("dias").map(String),
    abertura: String(formData.get("abertura") ?? ""),
    fechamento: String(formData.get("fechamento") ?? ""),
  });
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await configurarFuncionamento(
      dependenciasClinica(),
      sessao,
      validado.valor,
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/clinica");
    return estado("sucesso", "Horário salvo");
  } catch (erro) {
    return estado("erro", falha(erro).mensagem);
  }
}

export async function adicionar(
  _estado: EstadoFormulario,
  _formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await adicionarCadeira(dependenciasClinica(), sessao);
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/clinica");
    return estado("sucesso", "Cadeira adicionada", resultado.valor.identificacao);
  } catch (erro) {
    return estado("erro", falha(erro).mensagem);
  }
}

export async function desativar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const cadeiraId = String(formData.get("id") ?? "");
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await desativarCadeira(
      dependenciasClinica(),
      sessao,
      cadeiraId,
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/clinica");
    return estado("sucesso", "Cadeira desativada", resultado.valor.identificacao);
  } catch (erro) {
    return estado("erro", falha(erro).mensagem);
  }
}
