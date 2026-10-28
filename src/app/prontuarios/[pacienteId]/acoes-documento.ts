"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../../domain/auth/casos";
import {
  criarModelo as criarModeloDominio,
  gerarDocumento as gerarDocumentoDominio,
  importarModelo as importarModeloDominio,
  obterDocumento,
} from "../../../domain/documento/casos";
import { dependencias, dependenciasDocumento } from "../../dependencias";
import { falha } from "../../falha";
import { estado, type EstadoFormulario } from "../../formulario";

const SEM_SESSAO = "Nenhuma sessão aberta";

export type ResultadoPdf =
  | { ok: true; base64: string; nome: string }
  | { ok: false; mensagem: string };

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "");
}

export async function gerarDocumento(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const resultado = await gerarDocumentoDominio(
      dependenciasDocumento(),
      sessao,
      {
        modeloId: texto(formData, "modeloId"),
        pacienteId,
        anteriorId: texto(formData, "anteriorId") || null,
      },
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", "Documento gerado");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function criarModelo(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const resultado = await criarModeloDominio(dependenciasDocumento(), sessao, {
      nome: texto(formData, "nome"),
      conteudo: texto(formData, "conteudo"),
      compartilhado: formData.get("compartilhado") === "on",
    });
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", "Modelo salvo");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function importarModelo(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const pacienteId = texto(formData, "pacienteId");
    const resultado = await importarModeloDominio(
      dependenciasDocumento(),
      sessao,
      texto(formData, "modeloId"),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", "Modelo importado");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function baixarPdf(documentoId: string): Promise<ResultadoPdf> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return { ok: false, mensagem: SEM_SESSAO };
    const resultado = await obterDocumento(dependenciasDocumento(), sessao, documentoId);
    if (!resultado.ok) return { ok: false, mensagem: resultado.mensagem };
    const { id, pdf } = resultado.valor;
    return { ok: true, base64: Buffer.from(pdf).toString("base64"), nome: `documento-${id}.pdf` };
  } catch (causa) {
    return { ok: false, mensagem: falha(causa).mensagem };
  }
}
