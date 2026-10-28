"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../domain/auth/casos";
import { MENSAGEM_PAPEL } from "../../domain/auth/tipos";
import { salvarModelo } from "../../domain/mensagem/casos";
import { dependencias, dependenciasMensagem } from "../dependencias";
import { falha } from "../falha";
import { estado, type EstadoFormulario } from "../formulario";

const SEM_SESSAO = "Nenhuma sessão aberta";

const TIPOS = ["confirmacao_agendamento", "lembrete_24h", "lembrete_5h"] as const;
type TipoMensagem = (typeof TIPOS)[number];

function ehTipo(valor: string): valor is TipoMensagem {
  return (TIPOS as readonly string[]).includes(valor);
}

export async function salvar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    if (sessao.usuario.papel !== "admin") return estado("erro", MENSAGEM_PAPEL);

    const tipo = String(formData.get("tipo") ?? "");
    const conteudo = String(formData.get("conteudo") ?? "");
    if (!ehTipo(tipo)) return estado("erro", "Não foi possível concluir a ação");

    const resultado = await salvarModelo(dependenciasMensagem(), sessao, { tipo, conteudo });
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/mensagens");
    return estado("sucesso", "Modelo salvo");
  } catch (erro) {
    return estado("erro", falha(erro).mensagem);
  }
}
