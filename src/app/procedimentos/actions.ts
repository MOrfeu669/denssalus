"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../domain/auth/casos";
import {
  criarProcedimento,
  editarProcedimento,
  excluirProcedimento,
} from "../../domain/procedimento/casos";
import { dependencias, dependenciasProcedimento } from "../dependencias";
import { falha } from "../falha";
import { estado, type EstadoFormulario } from "../formulario";
import { validarProcedimento, type CamposProcedimento } from "./validar";

const SEM_SESSAO = "Nenhuma sessão aberta";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

function campos(formData: FormData): CamposProcedimento {
  return {
    nome: texto(formData, "nome"),
    tempoMedioMinutos: texto(formData, "tempoMedioMinutos"),
    valorMedio: texto(formData, "valorMedio"),
  };
}

export async function cadastrar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarProcedimento(campos(formData));
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await criarProcedimento(dependenciasProcedimento(), sessao, validado.valor);
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/procedimentos");
    return estado("sucesso", "Procedimento criado", validado.valor.nome);
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function editar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarProcedimento(campos(formData));
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await editarProcedimento(
      dependenciasProcedimento(),
      sessao,
      texto(formData, "id"),
      validado.valor,
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/procedimentos");
    return estado("sucesso", "Procedimento salvo", validado.valor.nome);
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function excluir(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await excluirProcedimento(
      dependenciasProcedimento(),
      sessao,
      texto(formData, "id"),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/procedimentos");
    return estado("sucesso", "Procedimento excluído");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}
