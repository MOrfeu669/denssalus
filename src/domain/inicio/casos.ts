import { MENSAGEM_PAPEL, type Resultado, type Sessao } from "../auth/tipos";
import type { Agendamentos } from "../agendamento/portas";
import type { Cadeiras, Clinicas } from "../clinica/portas";
import type { Dentistas } from "../dentista/portas";
import type { Pacientes } from "../paciente/portas";
import { BASE_VAZIA, type BaseDaClinica } from "./tipos";

export type Dependencias = {
  clinicas: Pick<Clinicas, "buscarPorId">;
  cadeiras: Pick<Cadeiras, "listar">;
  dentistas: Pick<Dentistas, "listar">;
  pacientes: Pick<Pacientes, "listar">;
  agendamentos: Pick<Agendamentos, "listar">;
};

export async function lerBaseDaClinica(
  deps: Dependencias,
  ator: Sessao,
): Promise<Resultado<BaseDaClinica>> {
  if (!ator.usuario.ativo) return { ok: false, mensagem: MENSAGEM_PAPEL };

  const clinicaId = ator.usuario.clinicaId;
  if (!clinicaId) return { ok: true, valor: { ...BASE_VAZIA } };
  const clinica = await deps.clinicas.buscarPorId(clinicaId);
  if (!clinica || clinica.id !== clinicaId) return { ok: true, valor: { ...BASE_VAZIA } };

  const [cadeiras, dentistas, pacientes, agendamentos] = await Promise.all([
    deps.cadeiras.listar(clinicaId),
    deps.dentistas.listar(clinicaId),
    deps.pacientes.listar(clinicaId),
    deps.agendamentos.listar(clinicaId),
  ]);

  return {
    ok: true,
    valor: {
      nome: clinica.nome,
      temClinica: true,
      temCadeiraAtiva: cadeiras.some((item) => item.clinicaId === clinicaId && item.ativa),
      temDentistaAtivo: dentistas.some((item) => item.clinicaId === clinicaId && item.ativo),
      temPaciente: pacientes.some((item) => item.clinicaId === clinicaId),
      temAgendamento: agendamentos.some((item) => item.clinicaId === clinicaId),
    },
  };
}
