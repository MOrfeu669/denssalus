import type { Dependencias as DependenciasDentista } from "../../domain/dentista/portas";
import type { AgendamentoDoDentista } from "../../domain/dentista/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type AgendaDoDentista = DependenciasDentista["agenda"];

type LinhaAlertaDentista = {
  id: string;
  clinica_id: string;
  dentista_id: string;
  inicio: string;
  alerta_dentista: boolean;
};

const COLUNAS = "id, clinica_id, dentista_id, inicio, alerta_dentista";

function paraAgendamentoDoDentista(linha: LinhaAlertaDentista): AgendamentoDoDentista {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    dentistaId: linha.dentista_id,
    inicio: linha.inicio,
    alertaDentista: linha.alerta_dentista,
  };
}

export function criarAgendaDentistas(): AgendaDoDentista {
  const admin = createAdminClient();

  return {
    async listarAgendadosFuturos(clinicaId, agora) {
      const { data, error } = await admin
        .from("agendamentos")
        .select(COLUNAS)
        .eq("clinica_id", clinicaId)
        .eq("status", "agendado")
        .gt("inicio", agora.toISOString());
      if (error) throw new ErroAplicacao("Não foi possível listar os agendamentos", error);
      return (data as LinhaAlertaDentista[]).map(paraAgendamentoDoDentista);
    },

    async salvarAlertas(itens) {
      for (const item of itens) {
        const { error } = await admin
          .from("agendamentos")
          .update({ alerta_dentista: item.alertaDentista })
          .eq("id", item.id);
        if (error) throw new ErroAplicacao("Não foi possível salvar os alertas", error);
      }
    },
  };
}
