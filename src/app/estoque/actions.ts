"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../domain/auth/casos";
import { criarMaterial, reabastecer, vincularMaterial } from "../../domain/estoque/casos";
import { dependencias, dependenciasEstoque } from "../dependencias";
import { falha } from "../falha";
import { estado, type EstadoFormulario } from "../formulario";
import { validarNovoMaterial, validarReabastecimento, validarVinculo } from "./validar";

const SEM_SESSAO = "Nenhuma sessão aberta";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

export async function cadastrarMaterial(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarNovoMaterial({
    nome: texto(formData, "nome"),
    quantidade: texto(formData, "quantidade"),
    quantidadeMinima: texto(formData, "quantidadeMinima"),
    validade: texto(formData, "validade"),
  });
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await criarMaterial(dependenciasEstoque(), sessao, validado.valor, new Date());
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/estoque");
    return estado("sucesso", "Material cadastrado", validado.valor.nome);
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function reabastecerMaterial(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarReabastecimento({
    quantidade: texto(formData, "quantidade"),
    validade: texto(formData, "validade"),
  });
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await reabastecer(
      dependenciasEstoque(),
      sessao,
      texto(formData, "materialId"),
      validado.valor,
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/estoque");
    return estado("sucesso", "Material reabastecido", texto(formData, "nomeMaterial"));
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function vincular(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarVinculo({
    procedimentoId: texto(formData, "procedimentoId"),
    materialId: texto(formData, "materialId"),
    quantidade: texto(formData, "quantidade"),
  });
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await vincularMaterial(dependenciasEstoque(), sessao, validado.valor);
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/estoque");
    return estado("sucesso", "Material vinculado");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}
