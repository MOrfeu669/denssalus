"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../domain/auth/casos";
import { cadastrarLaboratorio } from "../../domain/protese/casos";
import { dependencias, dependenciasProtese } from "../dependencias";
import { falha } from "../falha";
import { estado, type EstadoFormulario } from "../formulario";

const SEM_SESSAO = "Nenhuma sessão aberta";

export async function cadastrar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await cadastrarLaboratorio(
      dependenciasProtese(),
      sessao,
      String(formData.get("nome") ?? ""),
    );
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath("/laboratorios");
    revalidatePath("/prontuarios");
    return estado("sucesso", "Laboratório cadastrado", resultado.valor.nome);
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}
