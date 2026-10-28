import type { RegistrosOdontograma } from "../../domain/odontograma/portas";
import type { RegistroOdontograma } from "../../domain/odontograma/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type LinhaRegistro = {
  id: string;
  clinica_id: string;
  paciente_id: string;
  dente: number;
  quadrante: string;
  procedimento_id: string;
  origem: string;
  agendamento_id: string | null;
  status: string;
  registrado_por: string;
  registrado_em: string;
};

function paraRegistro(linha: LinhaRegistro): RegistroOdontograma {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    pacienteId: linha.paciente_id,
    dente: linha.dente,
    quadrante: linha.quadrante as RegistroOdontograma["quadrante"],
    procedimentoId: linha.procedimento_id,
    origem: linha.origem as RegistroOdontograma["origem"],
    agendamentoId: linha.agendamento_id,
    status: linha.status as RegistroOdontograma["status"],
    registradoPor: linha.registrado_por,
    registradoEm: linha.registrado_em,
  };
}

function paraLinha(registro: RegistroOdontograma): LinhaRegistro {
  return {
    id: registro.id,
    clinica_id: registro.clinicaId,
    paciente_id: registro.pacienteId,
    dente: registro.dente,
    quadrante: registro.quadrante,
    procedimento_id: registro.procedimentoId,
    origem: registro.origem,
    agendamento_id: registro.agendamentoId,
    status: registro.status,
    registrado_por: registro.registradoPor,
    registrado_em: registro.registradoEm,
  };
}

export function criarOdontograma(): RegistrosOdontograma {
  const admin = createAdminClient();

  return {
    async listarPorPaciente(clinicaId, pacienteId) {
      const { data, error } = await admin
        .from("registros_odontograma")
        .select("*")
        .eq("clinica_id", clinicaId)
        .eq("paciente_id", pacienteId);
      if (error) {
        throw new ErroAplicacao("Não foi possível listar os registros do odontograma", error);
      }
      return (data as LinhaRegistro[]).map(paraRegistro);
    },

    async listarPorAgendamento(clinicaId, agendamentoId) {
      const { data, error } = await admin
        .from("registros_odontograma")
        .select("*")
        .eq("clinica_id", clinicaId)
        .eq("agendamento_id", agendamentoId);
      if (error) {
        throw new ErroAplicacao("Não foi possível listar os registros do odontograma", error);
      }
      return (data as LinhaRegistro[]).map(paraRegistro);
    },

    async buscarPorId(id) {
      const { data, error } = await admin
        .from("registros_odontograma")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        throw new ErroAplicacao("Não foi possível ler o registro do odontograma", error);
      }
      return data ? paraRegistro(data as LinhaRegistro) : null;
    },

    async salvar(registro) {
      const { error } = await admin
        .from("registros_odontograma")
        .upsert(paraLinha(registro), { onConflict: "id" });
      if (error) {
        throw new ErroAplicacao("Não foi possível salvar o registro do odontograma", error);
      }
    },
  };
}
