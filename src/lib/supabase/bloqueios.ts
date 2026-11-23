import type { Dependencias as DependenciasAgendamento } from "../../domain/agendamento/portas";
import type { BloqueioAgenda } from "../../domain/agendamento/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type BloqueiosAgenda = DependenciasAgendamento["bloqueios"];

type LinhaBloqueio = {
  id: string;
  clinica_id: string;
  dentista_id: string;
  inicio: string;
  fim: string;
  motivo: string | null;
  criado_por: string;
  frequencia?: string | null;
  data_fim?: string | null;
  excecoes?: string[] | null;
};

function paraBloqueio(linha: LinhaBloqueio): BloqueioAgenda {
  const frequencia = linha.frequencia === "diaria" || linha.frequencia === "semanal" ? linha.frequencia : "pontual";
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    dentistaId: linha.dentista_id,
    inicio: linha.inicio,
    fim: linha.fim,
    motivo: linha.motivo,
    criadoPor: linha.criado_por,
    frequencia,
    dataFim: linha.data_fim ? linha.data_fim.slice(0, 10) : null,
    excecoes: (linha.excecoes ?? []).map((data) => data.slice(0, 10)),
  };
}

function paraLinha(bloqueio: BloqueioAgenda): LinhaBloqueio {
  return {
    id: bloqueio.id,
    clinica_id: bloqueio.clinicaId,
    dentista_id: bloqueio.dentistaId,
    inicio: bloqueio.inicio,
    fim: bloqueio.fim,
    motivo: bloqueio.motivo,
    criado_por: bloqueio.criadoPor,
    frequencia: bloqueio.frequencia ?? "pontual",
    data_fim: bloqueio.dataFim ?? null,
    excecoes: bloqueio.excecoes ?? [],
  };
}

export function criarBloqueios(): BloqueiosAgenda {
  const admin = createAdminClient();

  return {
    async listar(clinicaId) {
      const { data, error } = await admin
        .from("bloqueios_agenda")
        .select("*")
        .eq("clinica_id", clinicaId)
        .order("inicio", { ascending: true });
      if (error) throw new ErroAplicacao("Não foi possível listar os bloqueios", error);
      return (data as LinhaBloqueio[]).map(paraBloqueio);
    },

    async listarEntre(clinicaId: string, inicio: string, fim: string) {
      const { data, error } = await admin
        .from("bloqueios_agenda")
        .select("*")
        .eq("clinica_id", clinicaId)
        .lt("inicio", fim)
        .or(`fim.gt.${inicio},data_fim.gte.${inicio.slice(0, 10)}`)
        .order("inicio", { ascending: true });
      if (error) throw new ErroAplicacao("Não foi possível listar os bloqueios", error);
      return (data as LinhaBloqueio[]).map(paraBloqueio);
    },

    async salvar(bloqueio) {
      const { error } = await admin
        .from("bloqueios_agenda")
        .upsert(paraLinha(bloqueio), { onConflict: "id" });
      if (error) throw new ErroAplicacao("Não foi possível salvar o bloqueio", error);
    },
  };
}
