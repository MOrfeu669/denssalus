import type { Dependencias as DependenciasAgendamento } from "../../domain/agendamento/portas";
import type {
  Agendamento,
  ConflitoAgenda,
  StatusAgendamento,
} from "../../domain/agendamento/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type Agendamentos = DependenciasAgendamento["agendamentos"];

type LinhaAgendamento = {
  id: string;
  clinica_id: string;
  paciente_id: string;
  dentista_id: string;
  cadeira_id: string;
  procedimento_id: string | null;
  inicio: string;
  fim: string;
  status: string;
  iniciado_por: string | null;
  emergencia: boolean;
  criado_por: string;
  alerta_cadeira: boolean;
  alerta_horario: boolean;
  alerta_dentista: boolean;
  motivo_cancelamento: string | null;
  cancelado_por: string | null;
  cancelado_em: string | null;
};

type ErroPostgres = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

function paraAgendamento(linha: LinhaAgendamento): Agendamento {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    pacienteId: linha.paciente_id,
    dentistaId: linha.dentista_id,
    cadeiraId: linha.cadeira_id,
    procedimentoId: linha.procedimento_id,
    inicio: linha.inicio,
    fim: linha.fim,
    status: linha.status as StatusAgendamento,
    iniciadoPor: linha.iniciado_por,
    emergencia: linha.emergencia,
    criadoPor: linha.criado_por,
    alertaCadeira: linha.alerta_cadeira,
    alertaHorario: linha.alerta_horario,
    alertaDentista: linha.alerta_dentista,
    motivoCancelamento: linha.motivo_cancelamento,
    canceladoPor: linha.cancelado_por,
    canceladoEm: linha.cancelado_em,
  };
}

function paraLinha(agendamento: Agendamento): LinhaAgendamento {
  return {
    id: agendamento.id,
    clinica_id: agendamento.clinicaId,
    paciente_id: agendamento.pacienteId,
    dentista_id: agendamento.dentistaId,
    cadeira_id: agendamento.cadeiraId,
    procedimento_id: agendamento.procedimentoId,
    inicio: agendamento.inicio,
    fim: agendamento.fim,
    status: agendamento.status,
    iniciado_por: agendamento.iniciadoPor,
    emergencia: agendamento.emergencia,
    criado_por: agendamento.criadoPor,
    alerta_cadeira: agendamento.alertaCadeira,
    alerta_horario: agendamento.alertaHorario,
    alerta_dentista: agendamento.alertaDentista,
    motivo_cancelamento: agendamento.motivoCancelamento,
    cancelado_por: agendamento.canceladoPor,
    cancelado_em: agendamento.canceladoEm,
  };
}

function conflitoDeExclusao(erro: ErroPostgres): ConflitoAgenda | null {
  if (erro.code !== "23P01") return null;
  const texto = `${erro.message ?? ""} ${erro.details ?? ""} ${erro.hint ?? ""}`;
  if (texto.includes("agendamentos_cadeira_excl")) return "cadeira";
  if (texto.includes("agendamentos_dentista_excl")) return "dentista";
  if (texto.includes("agendamentos_paciente_excl")) return "paciente";
  return null;
}

export function criarAgendamentos(): Agendamentos {
  const admin = createAdminClient();

  return {
    async listar(clinicaId) {
      const { data, error } = await admin
        .from("agendamentos")
        .select("*")
        .eq("clinica_id", clinicaId)
        .order("inicio", { ascending: true });
      if (error) throw new ErroAplicacao("Não foi possível listar os agendamentos", error);
      return (data as LinhaAgendamento[]).map(paraAgendamento);
    },

    async listarEntre(clinicaId: string, inicio: string, fim: string) {
      const { data, error } = await admin
        .from("agendamentos")
        .select("*")
        .eq("clinica_id", clinicaId)
        .lt("inicio", fim)
        .gt("fim", inicio)
        .order("inicio", { ascending: true });
      if (error) throw new ErroAplicacao("Não foi possível listar os agendamentos", error);
      return (data as LinhaAgendamento[]).map(paraAgendamento);
    },

    async buscarPorId(id) {
      const { data, error } = await admin
        .from("agendamentos")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o agendamento", error);
      return data ? paraAgendamento(data as LinhaAgendamento) : null;
    },

    async salvar(agendamento) {
      const { error } = await admin
        .from("agendamentos")
        .upsert(paraLinha(agendamento), { onConflict: "id" });
      if (!error) return null;
      const conflito = conflitoDeExclusao(error);
      if (conflito) return conflito;
      throw new ErroAplicacao("Não foi possível salvar o agendamento", error);
    },
  };
}
