"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../../domain/auth/casos";
import {
  confirmarImagem,
  excluirImagem as excluirImagemDominio,
  prepararUpload,
  restaurarImagem as restaurarImagemDominio,
} from "../../../domain/imagem/casos";
import { dependencias, dependenciasImagem, urlsImagem } from "../../dependencias";
import { falha } from "../../falha";
import { estado, type EstadoFormulario } from "../../formulario";

const SEM_SESSAO = "Nenhuma sessão aberta";

export type ResultadoPreparo =
  | { ok: true; id: string; caminho: string; url: string; token: string }
  | { ok: false; mensagem: string };

// Metadados apenas: o arquivo vai do navegador direto ao Storage.
export type EntradaConfirmar = {
  pacienteId: string;
  id: string;
  caminho: string;
  tamanhoBytes: number;
  tipoCaso: string;
  descricao: string;
  dente: number | null;
  agendamentoId: string | null;
};

export async function prepararEnvio(pacienteId: string): Promise<ResultadoPreparo> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return { ok: false, mensagem: SEM_SESSAO };
    const preparo = await prepararUpload(dependenciasImagem(), sessao, pacienteId);
    if (!preparo.ok) return { ok: false, mensagem: preparo.mensagem };
    const { id, caminho } = preparo.valor;
    const { url, token } = await urlsImagem().urlDeUpload(caminho);
    return { ok: true, id, caminho, url, token };
  } catch (causa) {
    return falha(causa);
  }
}

export async function confirmarEnvio(entrada: EntradaConfirmar): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await confirmarImagem(
      dependenciasImagem(),
      sessao,
      {
        id: entrada.id,
        pacienteId: entrada.pacienteId,
        agendamentoId: entrada.agendamentoId || null,
        dente: entrada.dente,
        tipoCaso: entrada.tipoCaso,
        descricao: entrada.descricao,
        caminho: entrada.caminho,
        tamanhoBytes: entrada.tamanhoBytes,
      },
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${entrada.pacienteId}`);
    return estado("sucesso", "Imagem anexada");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function excluirImagem(
  pacienteId: string,
  imagemId: string,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await excluirImagemDominio(
      dependenciasImagem(),
      sessao,
      imagemId,
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", "Imagem excluída");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function restaurarImagem(
  pacienteId: string,
  imagemId: string,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await restaurarImagemDominio(
      dependenciasImagem(),
      sessao,
      imagemId,
      new Date(),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${pacienteId}`);
    return estado("sucesso", "Imagem restaurada");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}
