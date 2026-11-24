import type { Sessao } from "../domain/auth/tipos";
import { listarRetornosPendentes } from "../domain/retorno/casos";
import { dependenciasRetorno } from "./dependencias";

/**
 * Só entra contador cujo dado a clínica já tem.
 * Mensagens fica de fora: a fila existe, mas a tela é de modelo e não há regra de qual estado soma o selo.
 */
export async function contadoresDaLateral(sessao: Sessao): Promise<Record<string, number>> {
  try {
    const resultado = await listarRetornosPendentes(dependenciasRetorno(), sessao);
    if (!resultado.ok) return {};
    const abertos = resultado.valor.filter((item) => item.clinicaId === sessao.usuario.clinicaId);
    if (abertos.length === 0) return {};
    return { "/retornos": abertos.length };
  } catch {
    return {};
  }
}
