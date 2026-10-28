"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../../domain/auth/casos";
import {
  aplicarDesconto as aplicarDescontoDominio,
  quitarDebito as quitarDebitoDominio,
} from "../../../domain/debito/casos";
import type { FormaPagamento } from "../../../domain/debito/tipos";
import { dependencias, dependenciasDebito } from "../../dependencias";
import { falha } from "../../falha";
import { estado, type EstadoFormulario } from "../../formulario";

const SEM_SESSAO = "Nenhuma sessão aberta";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

export async function aplicarDesconto(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const resultado = await aplicarDescontoDominio(
      dependenciasDebito(),
      sessao,
      texto(formData, "debitoId"),
      Number(texto(formData, "desconto")),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", "Desconto aplicado");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function quitarDebito(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const resultado = await quitarDebitoDominio(
      dependenciasDebito(),
      sessao,
      texto(formData, "debitoId"),
      { forma: texto(formData, "forma") as FormaPagamento, data: texto(formData, "data") },
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", "Débito quitado");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}
