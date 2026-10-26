import type { Dependencias as DependenciasProcedimento } from "../../domain/procedimento/portas";
import type { Procedimento } from "../../domain/procedimento/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type Procedimentos = DependenciasProcedimento["procedimentos"];

type LinhaProcedimento = {
  id: string;
  clinica_id: string;
  nome: string;
  tempo_medio_minutos: number | string;
  valor_medio: number | string;
};

const COLUNAS = "id, clinica_id, nome, tempo_medio_minutos, valor_medio";

function paraProcedimento(linha: LinhaProcedimento): Procedimento {
  const tempoMedioMinutos = Number(linha.tempo_medio_minutos);
  const valorMedio = Number(linha.valor_medio);
  if (!Number.isFinite(tempoMedioMinutos) || !Number.isFinite(valorMedio)) {
    throw new ErroAplicacao("Não foi possível ler o procedimento");
  }

  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    nome: linha.nome,
    tempoMedioMinutos,
    valorMedio,
  };
}

function paraLinha(procedimento: Procedimento): LinhaProcedimento {
  return {
    id: procedimento.id,
    clinica_id: procedimento.clinicaId,
    nome: procedimento.nome,
    tempo_medio_minutos: procedimento.tempoMedioMinutos,
    valor_medio: procedimento.valorMedio,
  };
}

export function criarProcedimentos(): Procedimentos {
  const admin = createAdminClient();

  return {
    async listar(clinicaId) {
      const { data, error } = await admin
        .from("procedimentos")
        .select(COLUNAS)
        .eq("clinica_id", clinicaId);
      if (error) throw new ErroAplicacao("Não foi possível listar os procedimentos", error);
      return (data as LinhaProcedimento[])
        .map(paraProcedimento)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    },

    async buscarPorId(id) {
      const { data, error } = await admin
        .from("procedimentos")
        .select(COLUNAS)
        .eq("id", id)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o procedimento", error);
      return data ? paraProcedimento(data as LinhaProcedimento) : null;
    },

    async salvar(procedimento) {
      const { error } = await admin.from("procedimentos").upsert(paraLinha(procedimento));
      if (error) throw new ErroAplicacao("Não foi possível salvar o procedimento", error);
    },

    async remover(id) {
      const { error } = await admin.from("procedimentos").delete().eq("id", id);
      if (error) throw new ErroAplicacao("Não foi possível excluir o procedimento", error);
    },
  };
}
