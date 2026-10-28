import type {
  ConfiguracoesRetorno,
  Retornos,
} from "../../domain/retorno/portas";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type Retorno = Parameters<Retornos["salvar"]>[0];
type ConfiguracaoRetorno = Parameters<ConfiguracoesRetorno["salvar"]>[0];

type LinhaRetorno = {
  id: string;
  clinica_id: string;
  paciente_id: string;
  dentista_id: string;
  agendamento_origem_id: string;
  marcado_por: string;
  data_prevista: string;
  status: string;
};

type LinhaConfiguracao = {
  clinica_id: string;
  dias_antecedencia: number;
};

function paraRetorno(linha: LinhaRetorno): Retorno {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    pacienteId: linha.paciente_id,
    dentistaId: linha.dentista_id,
    agendamentoOrigemId: linha.agendamento_origem_id,
    marcadoPor: linha.marcado_por,
    dataPrevista: linha.data_prevista.slice(0, 10),
    status: linha.status as Retorno["status"],
  };
}

function paraLinhaRetorno(retorno: Retorno): LinhaRetorno {
  return {
    id: retorno.id,
    clinica_id: retorno.clinicaId,
    paciente_id: retorno.pacienteId,
    dentista_id: retorno.dentistaId,
    agendamento_origem_id: retorno.agendamentoOrigemId,
    marcado_por: retorno.marcadoPor,
    data_prevista: retorno.dataPrevista,
    status: retorno.status,
  };
}

export function criarRetornos(): Retornos {
  const admin = createAdminClient();

  return {
    async listar(clinicaId) {
      const { data, error } = await admin
        .from("retornos")
        .select("*")
        .eq("clinica_id", clinicaId);
      if (error) throw new ErroAplicacao("Não foi possível listar os retornos", error);
      return (data as LinhaRetorno[]).map(paraRetorno);
    },

    async listarPorStatus(status) {
      const { data, error } = await admin
        .from("retornos")
        .select("*")
        .eq("status", status);
      if (error) throw new ErroAplicacao("Não foi possível listar os retornos", error);
      return (data as LinhaRetorno[]).map(paraRetorno);
    },

    async buscarPorAgendamentoOrigem(agendamentoOrigemId) {
      const { data, error } = await admin
        .from("retornos")
        .select("*")
        .eq("agendamento_origem_id", agendamentoOrigemId)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o retorno", error);
      return data ? paraRetorno(data as LinhaRetorno) : null;
    },

    async salvar(retorno) {
      const { error } = await admin
        .from("retornos")
        .upsert(paraLinhaRetorno(retorno), { onConflict: "id" });
      if (error) throw new ErroAplicacao("Não foi possível salvar o retorno", error);
    },
  };
}

export function criarConfiguracoesRetorno(): ConfiguracoesRetorno {
  const admin = createAdminClient();

  return {
    async buscar(clinicaId) {
      const { data, error } = await admin
        .from("retorno_config")
        .select("*")
        .eq("clinica_id", clinicaId)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o prazo", error);
      if (!data) return null;
      const linha = data as LinhaConfiguracao;
      return {
        clinicaId: linha.clinica_id,
        diasAntecedencia: linha.dias_antecedencia,
      } as ConfiguracaoRetorno;
    },

    async salvar(configuracao) {
      const { error } = await admin.from("retorno_config").upsert({
        clinica_id: configuracao.clinicaId,
        dias_antecedencia: configuracao.diasAntecedencia,
      });
      if (error) throw new ErroAplicacao("Não foi possível salvar o prazo", error);
    },
  };
}
