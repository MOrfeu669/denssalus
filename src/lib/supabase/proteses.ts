import type {
  AvisosProtese,
  ConfiguracoesProtese,
  Proteses,
} from "../../domain/protese/portas";
import type {
  AvisoProtese,
  ConfigAtrasoProtese,
  EtapaProtese,
  PassagemProtese,
  Protese,
  StatusProtese,
} from "../../domain/protese/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type LinhaProtese = {
  id: string;
  clinica_id: string;
  paciente_id: string;
  dentes: number[];
  tipo: string;
  responsavel_id: string;
  laboratorio: string;
  procedimento_avaliacao_id: string | null;
  procedimento_cirurgia_id: string | null;
  agendamento_instalacao_id: string | null;
  etapa: string;
  status: string;
  prazo_retorno: string | null;
  ajuste_necessario: string | null;
  valor_comissao: number | string | null;
  alerta_atraso: boolean;
  historico: PassagemProtese[] | null;
};

type LinhaConfig = {
  clinica_id: string;
  dias_limite_atraso: number;
};

type LinhaAviso = {
  id: string;
  clinica_id: string;
  protese_id: string;
  tipo: string;
  criado_em: string;
};

function paraProtese(linha: LinhaProtese): Protese {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    pacienteId: linha.paciente_id,
    dentes: linha.dentes,
    tipo: linha.tipo,
    responsavelId: linha.responsavel_id,
    laboratorio: linha.laboratorio,
    procedimentoAvaliacaoId: linha.procedimento_avaliacao_id ?? null,
    procedimentoCirurgiaId: linha.procedimento_cirurgia_id ?? null,
    agendamentoInstalacaoId: linha.agendamento_instalacao_id ?? null,
    etapa: linha.etapa as EtapaProtese,
    status: linha.status as StatusProtese,
    prazoRetorno: linha.prazo_retorno ? linha.prazo_retorno.slice(0, 10) : null,
    ajusteNecessario: linha.ajuste_necessario ?? null,
    valorComissao:
      linha.valor_comissao === null || linha.valor_comissao === undefined
        ? null
        : Number(linha.valor_comissao),
    alertaAtraso: linha.alerta_atraso,
    historico: linha.historico ?? [],
  } as Protese;
}

function paraLinhaProtese(protese: Protese): LinhaProtese {
  return {
    id: protese.id,
    clinica_id: protese.clinicaId,
    paciente_id: protese.pacienteId,
    dentes: protese.dentes,
    tipo: protese.tipo,
    responsavel_id: protese.responsavelId,
    laboratorio: protese.laboratorio,
    procedimento_avaliacao_id: protese.procedimentoAvaliacaoId || null,
    procedimento_cirurgia_id: protese.procedimentoCirurgiaId || null,
    agendamento_instalacao_id: protese.agendamentoInstalacaoId || null,
    etapa: protese.etapa,
    status: protese.status,
    prazo_retorno: protese.prazoRetorno || null,
    ajuste_necessario: protese.ajusteNecessario || null,
    valor_comissao: protese.valorComissao ?? null,
    alerta_atraso: protese.alertaAtraso,
    historico: protese.historico ?? [],
  };
}

function paraAviso(linha: LinhaAviso): AvisoProtese {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    proteseId: linha.protese_id,
    tipo: linha.tipo,
    criadoEm: new Date(linha.criado_em).toISOString(),
  } as AvisoProtese;
}

export function criarProteses(): {
  proteses: Proteses;
  configuracoes: ConfiguracoesProtese;
  avisos: AvisosProtese;
} {
  const admin = createAdminClient();

  const proteses: Proteses = {
    async listarPorPaciente(clinicaId, pacienteId) {
      const { data, error } = await admin
        .from("proteses")
        .select("*")
        .eq("clinica_id", clinicaId)
        .eq("paciente_id", pacienteId);
      if (error) throw new ErroAplicacao("Não foi possível listar as próteses", error);
      return (data as LinhaProtese[]).map(paraProtese);
    },

    async buscarPorId(id) {
      const { data, error } = await admin
        .from("proteses")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler a prótese", error);
      return data ? paraProtese(data as LinhaProtese) : null;
    },

    async salvar(protese) {
      const { error } = await admin
        .from("proteses")
        .upsert(paraLinhaProtese(protese), { onConflict: "id" });
      if (error) throw new ErroAplicacao("Não foi possível salvar a prótese", error);
    },
  };

  const configuracoes: ConfiguracoesProtese = {
    async buscar(clinicaId) {
      const { data, error } = await admin
        .from("protese_config")
        .select("*")
        .eq("clinica_id", clinicaId)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler a configuração de prótese", error);
      if (!data) return null;
      const linha = data as LinhaConfig;
      return {
        clinicaId: linha.clinica_id,
        diasLimiteAtraso: linha.dias_limite_atraso,
      } as ConfigAtrasoProtese;
    },

    async salvar(configuracao) {
      const { error } = await admin.from("protese_config").upsert(
        {
          clinica_id: configuracao.clinicaId,
          dias_limite_atraso: configuracao.diasLimiteAtraso,
        },
        { onConflict: "clinica_id" },
      );
      if (error) throw new ErroAplicacao("Não foi possível salvar a configuração de prótese", error);
    },
  };

  const avisos: AvisosProtese = {
    async buscarPorProtese(proteseId) {
      const { data, error } = await admin
        .from("avisos_protese")
        .select("*")
        .eq("protese_id", proteseId)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o aviso de prótese", error);
      return data ? paraAviso(data as LinhaAviso) : null;
    },

    async salvar(aviso) {
      const { error } = await admin.from("avisos_protese").insert({
        id: aviso.id,
        clinica_id: aviso.clinicaId,
        protese_id: aviso.proteseId,
        tipo: aviso.tipo,
        criado_em: aviso.criadoEm,
      });
      if (error) throw new ErroAplicacao("Não foi possível salvar o aviso de prótese", error);
    },
  };

  return { proteses, configuracoes, avisos };
}
