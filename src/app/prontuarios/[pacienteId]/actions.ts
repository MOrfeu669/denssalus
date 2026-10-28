"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../../domain/auth/casos";
import { MENSAGEM_QUANTIDADE, type AjusteBaixa } from "../../../domain/estoque/tipos";
import { salvarAnamnese, salvarEvolucao } from "../../../domain/prontuario/casos";
import { dependencias, dependenciasProntuario } from "../../dependencias";
import { falha } from "../../falha";
import { estado, type EstadoFormulario } from "../../formulario";

const SEM_SESSAO = "Nenhuma sessão aberta";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

function lerAjustes(formData: FormData): AjusteBaixa[] | null {
  const ajustes: AjusteBaixa[] = [];
  for (const id of formData.getAll("materialId")) {
    const materialId = String(id);
    const bruto = texto(formData, `quantidade-${materialId}`).trim();
    if (!/^\d+$/.test(bruto)) return null;
    const quantidade = Number(bruto);
    if (!Number.isSafeInteger(quantidade)) return null;
    ajustes.push({ materialId, quantidade });
  }
  return ajustes;
}

export async function registrarAnamnese(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const resultado = await salvarAnamnese(
      dependenciasProntuario(),
      sessao,
      pacienteId,
      texto(formData, "conteudo"),
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", "Anamnese salva");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function registrarEvolucao(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const ajustes = lerAjustes(formData);
    if (!ajustes) return estado("erro", MENSAGEM_QUANTIDADE);
    const resultado = await salvarEvolucao(
      dependenciasProntuario(),
      sessao,
      texto(formData, "agendamentoId"),
      texto(formData, "texto"),
      new Date(),
      ajustes,
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", "Evolução salva");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}
