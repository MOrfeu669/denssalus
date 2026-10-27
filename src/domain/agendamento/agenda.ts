import { autorizarAcao } from "../auth/casos";
import type { Resultado, Sessao } from "../auth/tipos";
import { MENSAGEM_CLINICA_NAO_ENCONTRADA } from "../clinica/tipos";
import type { Dependencias } from "./portas";
import { filtrarGrade, semanaDe, somarDias } from "./regras";
import { MENSAGEM_HORARIO_INVALIDO, type FiltroAgenda, type Grade } from "./tipos";

export async function verAgenda(
  deps: Dependencias,
  ator: Sessao,
  filtro: FiltroAgenda,
): Promise<Resultado<Grade>> {
  const permitido = autorizarAcao(ator, "agenda:ver");
  if (!permitido.ok) return permitido;

  const clinicaId = ator.usuario.clinicaId;
  const clinica = await deps.clinicas.buscarPorId(clinicaId);
  if (!clinica) return { ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA };

  const dias = semanaDe(filtro.data);
  const seguinte = dias.length === 0 ? null : somarDias(dias[6], 1);
  if (seguinte === null) return { ok: false, mensagem: MENSAGEM_HORARIO_INVALIDO };
  const inicio = `${dias[0]}T00:00`;
  const fim = `${seguinte}T00:00`;

  const [agendamentos, bloqueios, pacientes, cadeiras, dentistas] = await Promise.all([
    deps.agendamentos.listarEntre(clinicaId, inicio, fim),
    deps.bloqueios.listarEntre(clinicaId, inicio, fim),
    deps.pacientes.listar(clinicaId),
    deps.cadeiras.listar(clinicaId),
    deps.dentistas.listar(clinicaId),
  ]);
  const pacientesDaClinica = new Set(
    pacientes.filter((item) => item.clinicaId === clinicaId).map((item) => item.id),
  );

  const grade = filtrarGrade(
    { ...filtro, modo: "semana" },
    {
      agendamentos: agendamentos.filter(
        (item) => item.clinicaId === clinicaId && pacientesDaClinica.has(item.pacienteId),
      ),
      bloqueios: bloqueios.filter((item) => item.clinicaId === clinicaId),
      cadeiras: cadeiras.filter((item) => item.clinicaId === clinicaId),
      dentistas: dentistas.filter((item) => item.clinicaId === clinicaId),
    },
    { horarioAbertura: clinica.horarioAbertura, horarioFechamento: clinica.horarioFechamento },
  );
  return { ok: true, valor: grade };
}
