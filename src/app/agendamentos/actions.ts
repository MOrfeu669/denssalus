"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../domain/auth/casos";
import {
  cancelarAgendamento,
  criarAgendamento,
  criarBloqueio,
  iniciarAtendimento,
  marcarChegada,
} from "../../domain/agendamento/casos";
import { dependencias, dependenciasAgendamento } from "../dependencias";
import { falha } from "../falha";
import { estado, type EstadoFormulario } from "../formulario";
import {
  validarAgendamento,
  validarBloqueio,
  validarCancelamento,
  type CamposAgendamento,
  type CamposBloqueio,
} from "./validar";

const SEM_SESSAO = "Nenhuma sessão aberta";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

function camposAgendamento(formData: FormData): CamposAgendamento {
  return {
    pacienteId: texto(formData, "pacienteId"),
    dentistaId: texto(formData, "dentistaId"),
    cadeiraId: texto(formData, "cadeiraId"),
    procedimentoId: texto(formData, "procedimentoId"),
    inicio: texto(formData, "inicio"),
    fim: texto(formData, "fim"),
  };
}

function camposBloqueio(formData: FormData): CamposBloqueio {
  return {
    dentistaId: texto(formData, "dentistaId"),
    inicio: texto(formData, "inicio"),
    fim: texto(formData, "fim"),
    motivo: texto(formData, "motivo"),
  };
}

export async function criar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarAgendamento(camposAgendamento(formData));
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await criarAgendamento(dependenciasAgendamento(), sessao, validado.valor);
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/agendamentos");
    return estado("sucesso", "Agendamento criado", resultado.valor.id);
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function iniciar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await iniciarAtendimento(
      dependenciasAgendamento(),
      sessao,
      texto(formData, "id"),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/agendamentos");
    return estado("sucesso", "Atendimento iniciado");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function chegar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await marcarChegada(
      dependenciasAgendamento(),
      sessao,
      texto(formData, "id"),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/agendamentos");
    return estado("sucesso", "Chegada marcada");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function bloquear(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarBloqueio(camposBloqueio(formData));
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await criarBloqueio(dependenciasAgendamento(), sessao, validado.valor);
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/agendamentos");
    return estado("sucesso", "Agenda bloqueada");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function cancelar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validado = validarCancelamento(texto(formData, "motivo"));
  if (!validado.ok) return estado("erro", validado.mensagem);

  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await cancelarAgendamento(
      dependenciasAgendamento(),
      sessao,
      texto(formData, "id"),
      validado.valor,
      new Date(),
      texto(formData, "confirmouReversao") === "sim",
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem, texto(formData, "id"));
    revalidatePath("/agendamentos");
    return estado("sucesso", "Deseja reagendar?", resultado.valor.id);
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}
