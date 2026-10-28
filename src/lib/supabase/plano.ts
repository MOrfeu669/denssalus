import type { ItensPlanoPorta, Planos } from "../../domain/plano/portas";
import type { ItemPlano, PlanoTratamento } from "../../domain/plano/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type LinhaPlano = {
  id: string;
  clinica_id: string;
  paciente_id: string;
  criado_por: string;
  status: string;
  criado_em: string;
};

type LinhaItem = {
  id: string;
  plano_id: string;
  clinica_id: string;
  procedimento_id: string;
  dentes: number[];
  valor: number | string;
  agendamento_id: string | null;
  status: string;
  executado_por: string | null;
  concluido_em: string | null;
};

function paraPlano(linha: LinhaPlano): PlanoTratamento {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    pacienteId: linha.paciente_id,
    criadoPor: linha.criado_por,
    status: linha.status as PlanoTratamento["status"],
    criadoEm: linha.criado_em,
  };
}

function paraLinhaPlano(plano: PlanoTratamento): LinhaPlano {
  return {
    id: plano.id,
    clinica_id: plano.clinicaId,
    paciente_id: plano.pacienteId,
    criado_por: plano.criadoPor,
    status: plano.status,
    criado_em: plano.criadoEm,
  };
}

function paraItem(linha: LinhaItem): ItemPlano {
  return {
    id: linha.id,
    planoId: linha.plano_id,
    procedimentoId: linha.procedimento_id,
    dentes: linha.dentes,
    valor: Number(linha.valor),
    agendamentoId: linha.agendamento_id,
    status: linha.status as ItemPlano["status"],
    executadoPor: linha.executado_por,
    concluidoEm: linha.concluido_em,
  };
}

function paraLinhaItem(item: ItemPlano, clinicaId: string): LinhaItem {
  return {
    id: item.id,
    plano_id: item.planoId,
    clinica_id: clinicaId,
    procedimento_id: item.procedimentoId,
    dentes: item.dentes,
    valor: item.valor,
    agendamento_id: item.agendamentoId,
    status: item.status,
    executado_por: item.executadoPor,
    concluido_em: item.concluidoEm,
  };
}

export function criarPlanos(): {
  planos: Planos;
  itens: ItensPlanoPorta;
} {
  const admin = createAdminClient();

  const planos: Planos = {
    async listarPorPaciente(clinicaId, pacienteId) {
      const { data, error } = await admin
        .from("planos_tratamento")
        .select("*")
        .eq("clinica_id", clinicaId)
        .eq("paciente_id", pacienteId);
      if (error) throw new ErroAplicacao("Não foi possível listar os planos", error);
      return (data as LinhaPlano[]).map(paraPlano);
    },

    async buscarPorId(id) {
      const { data, error } = await admin
        .from("planos_tratamento")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o plano", error);
      return data ? paraPlano(data as LinhaPlano) : null;
    },

    async salvar(plano) {
      const { error } = await admin
        .from("planos_tratamento")
        .upsert(paraLinhaPlano(plano), { onConflict: "id" });
      if (error) throw new ErroAplicacao("Não foi possível salvar o plano", error);
    },
  };

  const itens: ItensPlanoPorta = {
    async listarPorPlano(planoId) {
      const { data, error } = await admin
        .from("itens_plano")
        .select("*")
        .eq("plano_id", planoId);
      if (error) throw new ErroAplicacao("Não foi possível listar os itens do plano", error);
      return (data as LinhaItem[]).map(paraItem);
    },

    async listarPorAgendamento(clinicaId, agendamentoId) {
      const { data, error } = await admin
        .from("itens_plano")
        .select("*")
        .eq("clinica_id", clinicaId)
        .eq("agendamento_id", agendamentoId);
      if (error) throw new ErroAplicacao("Não foi possível listar os itens do plano", error);
      return (data as LinhaItem[]).map(paraItem);
    },

    async buscarPorId(id) {
      const { data, error } = await admin
        .from("itens_plano")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o item do plano", error);
      return data ? paraItem(data as LinhaItem) : null;
    },

    async salvar(item, clinicaId) {
      const { error } = await admin
        .from("itens_plano")
        .upsert(paraLinhaItem(item, clinicaId), { onConflict: "id" });
      if (error) throw new ErroAplicacao("Não foi possível salvar o item do plano", error);
    },
  };

  return { planos, itens };
}
