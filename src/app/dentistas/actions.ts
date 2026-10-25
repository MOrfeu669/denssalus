"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../domain/auth/casos";
import {
  cadastrarDentista,
  editarDentista,
  removerDentista,
} from "../../domain/dentista/casos";
import { dependencias, dependenciasDentista } from "../dependencias";
import { falha } from "../falha";
import { estado, type EstadoFormulario } from "../formulario";
import { validarCadastroDentista, validarEdicao } from "./validar";

const SEM_SESSAO = "Nenhuma sessão aberta";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

export async function cadastrar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarCadastroDentista({
    nome: texto(formData, "nome"),
    email: texto(formData, "email"),
    senha: texto(formData, "senha"),
    cro: texto(formData, "cro"),
    telefone: texto(formData, "telefone"),
    cpf: texto(formData, "cpf"),
    especialidades: texto(formData, "especialidades"),
  });
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await cadastrarDentista(dependenciasDentista(), sessao, validado.valor);
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/dentistas");
    return estado("sucesso", "Dentista cadastrado", validado.valor.nome);
  } catch (erro) {
    return estado("erro", falha(erro).mensagem);
  }
}

export async function editar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarEdicao({
    nome: texto(formData, "nome"),
    cro: texto(formData, "cro"),
    telefone: texto(formData, "telefone"),
    cpf: texto(formData, "cpf"),
    especialidades: texto(formData, "especialidades"),
  });
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await editarDentista(
      dependenciasDentista(),
      sessao,
      texto(formData, "id"),
      validado.valor,
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/dentistas");
    return estado("sucesso", "Dentista salvo", validado.valor.nome);
  } catch (erro) {
    return estado("erro", falha(erro).mensagem);
  }
}

export async function remover(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await removerDentista(
      dependenciasDentista(),
      sessao,
      texto(formData, "id"),
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/dentistas");
    return estado("sucesso", "Dentista removido");
  } catch (erro) {
    return estado("erro", falha(erro).mensagem);
  }
}
