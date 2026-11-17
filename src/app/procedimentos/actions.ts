"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../domain/auth/casos";
import type { Sessao } from "../../domain/auth/tipos";
import { vincularMaterial } from "../../domain/estoque/casos";
import {
  criarProcedimento,
  editarProcedimento,
  excluirProcedimento,
} from "../../domain/procedimento/casos";
import { dependencias, dependenciasEstoque, dependenciasProcedimento } from "../dependencias";
import { falha } from "../falha";
import { estado, type EstadoFormulario } from "../formulario";
import {
  validarMateriais,
  validarProcedimento,
  type CamposProcedimento,
  type MaterialInformado,
} from "./validar";

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

async function ligarMateriais(
  sessao: Sessao,
  procedimentoId: string,
  materiais: MaterialInformado[],
): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  for (const item of materiais) {
    const resultado = await vincularMaterial(dependenciasEstoque(), sessao, {
      procedimentoId,
      materialId: item.materialId,
      quantidade: item.quantidade,
    });
    if (!resultado.ok) return resultado;
  }
  return { ok: true };
}

export async function cadastrar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarProcedimento(campos(formData));
  if (!validado.ok) return estado("erro", validado.mensagem);
  const materiais = validarMateriais(formData);
  if (!materiais.ok) return estado("erro", materiais.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await criarProcedimento(dependenciasProcedimento(), sessao, validado.valor);
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    const ligado = await ligarMateriais(sessao, resultado.valor.id, materiais.valor);
    revalidatePath("/procedimentos");
    if (!ligado.ok) {
      return estado(
        "erro",
        `Procedimento criado. Não foi possível vincular o material. ${ligado.mensagem}`,
        "parcial",
      );
    }
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
  const materiais = validarMateriais(formData);
  if (!materiais.ok) return estado("erro", materiais.mensagem);

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
    const ligado = await ligarMateriais(sessao, resultado.valor.id, materiais.valor);
    revalidatePath("/procedimentos");
    if (!ligado.ok) {
      return estado(
        "erro",
        `Procedimento salvo. Não foi possível vincular o material. ${ligado.mensagem}`,
        "parcial",
      );
    }
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
