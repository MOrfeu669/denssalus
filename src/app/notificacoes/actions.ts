"use server";

import { revalidatePath } from "next/cache";
import { marcarLida } from "../../domain/notificacao/casos";
import { dependenciasNotificacao } from "../dependencias";
import { falha } from "../falha";
import { estado, type EstadoFormulario } from "../formulario";
import { sessaoAtual } from "../sessao";

const SEM_SESSAO = "Nenhuma sessão aberta";

export async function marcarComoLida(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    const sessao = await sessaoAtual();
    if (!sessao) return estado("erro", SEM_SESSAO);
    await marcarLida(
      dependenciasNotificacao(),
      sessao.usuario.id,
      String(formData.get("id") ?? ""),
      sessao.usuario.clinicaId,
    );
    revalidatePath("/", "layout");
    return estado("sucesso", "Notificação marcada como lida");
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}
