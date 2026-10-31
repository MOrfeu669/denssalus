import type { Sessao } from "../domain/auth/tipos";
import { dependenciasInicio } from "./dependencias";

export async function nomeDaClinica(sessao: Sessao): Promise<string | null> {
  const clinicaId = sessao.usuario.clinicaId;
  if (!clinicaId) return null;
  try {
    const clinica = await dependenciasInicio().clinicas.buscarPorId(clinicaId);
    if (!clinica || clinica.id !== clinicaId) return null;
    return clinica.nome;
  } catch {
    return null;
  }
}
