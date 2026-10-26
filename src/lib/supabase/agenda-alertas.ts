import type { Dependencias as DependenciasClinica } from "../../domain/clinica/portas";
import type { AgendamentoFuturo } from "../../domain/clinica/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type AgendaAlertas = DependenciasClinica["agenda"];

type LinhaAlerta = {
  id: string;
  clinica_id: string;
  cadeira_id: string;
  inicio: string;
  fim: string;
  alerta_cadeira: boolean;
  alerta_horario: boolean;
};

const COLUNAS = "id, clinica_id, cadeira_id, inicio, fim, alerta_cadeira, alerta_horario";

function paraAgendamentoFuturo(linha: LinhaAlerta): AgendamentoFuturo {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    cadeiraId: linha.cadeira_id,
    inicio: linha.inicio,
    fim: linha.fim,
    alertaCadeira: linha.alerta_cadeira,
    alertaHorario: linha.alerta_horario,
  };
}

export function criarAgendaAlertas(): AgendaAlertas {
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
      return (data as LinhaAlerta[]).map(paraAgendamentoFuturo);
    },

    async salvarAlertas(itens) {
      for (const item of itens) {
        const { error } = await admin
          .from("agendamentos")
          .update({
            alerta_cadeira: item.alertaCadeira,
            alerta_horario: item.alertaHorario,
          })
          .eq("id", item.id);
        if (error) throw new ErroAplicacao("Não foi possível salvar os alertas", error);
      }
    },
  };
}
