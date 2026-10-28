"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../../domain/auth/casos";
import {
  editarRegistro as editarRegistroDominio,
  registrarNoDente as registrarNoDenteDominio,
  registrarPreExistente as registrarPreExistenteDominio,
} from "../../../domain/odontograma/casos";
import { dependencias, dependenciasOdontograma } from "../../dependencias";
import { falha } from "../../falha";
import { estado, type EstadoFormulario } from "../../formulario";

const SEM_SESSAO = "Nenhuma sessão aberta";
const SUCESSO = "Registro salvo";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

export async function registrarNoDente(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const resultado = await registrarNoDenteDominio(
      dependenciasOdontograma(),
      sessao,
      {
        pacienteId,
        dente: Number(texto(formData, "dente")),
        procedimentoId: texto(formData, "procedimentoId"),
        agendamentoId: texto(formData, "agendamentoId"),
      },
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", SUCESSO);
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function registrarPreExistente(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const resultado = await registrarPreExistenteDominio(
      dependenciasOdontograma(),
      sessao,
      {
        pacienteId,
        dente: Number(texto(formData, "dente")),
        procedimentoId: texto(formData, "procedimentoId"),
      },
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", SUCESSO);
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function editarRegistro(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const resultado = await editarRegistroDominio(
      dependenciasOdontograma(),
      sessao,
      {
        registroId: texto(formData, "registroId"),
        procedimentoId: texto(formData, "procedimentoId"),
      },
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", SUCESSO);
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}
