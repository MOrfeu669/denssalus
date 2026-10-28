"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../domain/auth/casos";
import { configurarPrazo, marcarRetorno } from "../../domain/retorno/casos";
import { dependencias, dependenciasRetorno } from "../dependencias";
import { falha } from "../falha";
import { estado, type EstadoFormulario } from "../formulario";

const SEM_SESSAO = "Nenhuma sessão aberta";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

export async function marcar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await marcarRetorno(
      dependenciasRetorno(),
      sessao,
      {
        agendamentoOrigemId: texto(formData, "agendamentoOrigemId"),
        dataPrevista: texto(formData, "dataPrevista"),
      },
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/agendamentos");
    revalidatePath("/retornos");
    return estado("sucesso", "Retorno marcado");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function salvarPrazo(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await configurarPrazo(
      dependenciasRetorno(),
      sessao,
      Number(texto(formData, "diasAntecedencia")),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/retornos");
    return estado("sucesso", "Prazo salvo");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}
