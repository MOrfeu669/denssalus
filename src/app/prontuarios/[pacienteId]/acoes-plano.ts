"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../../domain/auth/casos";
import {
  adicionarItem as adicionarItemDominio,
  criarPlano as criarPlanoDominio,
  editarItem as editarItemDominio,
  marcarEmAndamento as marcarEmAndamentoDominio,
} from "../../../domain/plano/casos";
import { dependencias, dependenciasPlano } from "../../dependencias";
import { falha } from "../../falha";
import { estado, type EstadoFormulario } from "../../formulario";

const SEM_SESSAO = "Nenhuma sessão aberta";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

function dentes(formData: FormData): number[] {
  return texto(formData, "dentes")
    .split(/[\s,]+/)
    .filter((parte) => parte !== "")
    .map(Number);
}

function agendamento(formData: FormData): string | null {
  return texto(formData, "agendamentoId") || null;
}

export async function criarPlano(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const resultado = await criarPlanoDominio(
      dependenciasPlano(),
      sessao,
      pacienteId,
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", "Plano de tratamento criado");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function adicionarItem(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const resultado = await adicionarItemDominio(
      dependenciasPlano(),
      sessao,
      {
        planoId: texto(formData, "planoId"),
        procedimentoId: texto(formData, "procedimentoId"),
        dentes: dentes(formData),
        valor: Number(texto(formData, "valor")),
        agendamentoId: agendamento(formData),
      },
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", "Item adicionado");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function editarItem(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const resultado = await editarItemDominio(dependenciasPlano(), sessao, {
      itemId: texto(formData, "itemId"),
      procedimentoId: texto(formData, "procedimentoId"),
      dentes: dentes(formData),
      valor: Number(texto(formData, "valor")),
      agendamentoId: agendamento(formData),
    });
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", "Item salvo");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function marcarEmAndamento(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const resultado = await marcarEmAndamentoDominio(
      dependenciasPlano(),
      sessao,
      texto(formData, "planoId"),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", "Plano em andamento");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}
