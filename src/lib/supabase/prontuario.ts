import type {
  Anamneses,
  Auditoria,
  BaixaEstoque,
  Evolucoes,
} from "../../domain/prontuario/portas";
import type {
  Anamnese,
  Evolucao,
  RegistroAuditoria,
} from "../../domain/prontuario/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type LinhaAnamnese = {
  paciente_id: string;
  conteudo: string;
  preenchido_por: string;
  atualizado_em: string;
};

type LinhaEvolucao = {
  agendamento_id: string;
  texto: string;
  registrado_por: string;
  registrado_em: string;
};

type LinhaAuditoria = {
  id: string;
  clinica_id: string;
  entidade: string;
  entidade_id: string;
  usuario_id: string;
  acao: string;
  conteudo_anterior: string | null;
  registrado_em: string;
};

function paraAnamnese(linha: LinhaAnamnese): Anamnese {
  return {
    pacienteId: linha.paciente_id,
    conteudo: linha.conteudo,
    preenchidoPor: linha.preenchido_por,
    atualizadoEm: linha.atualizado_em,
  };
}

function paraLinhaAnamnese(anamnese: Anamnese): LinhaAnamnese {
  return {
    paciente_id: anamnese.pacienteId,
    conteudo: anamnese.conteudo,
    preenchido_por: anamnese.preenchidoPor,
    atualizado_em: anamnese.atualizadoEm,
  };
}

function paraEvolucao(linha: LinhaEvolucao): Evolucao {
  return {
    agendamentoId: linha.agendamento_id,
    texto: linha.texto,
    registradoPor: linha.registrado_por,
    registradoEm: linha.registrado_em,
  };
}

function paraLinhaEvolucao(evolucao: Evolucao): LinhaEvolucao {
  return {
    agendamento_id: evolucao.agendamentoId,
    texto: evolucao.texto,
    registrado_por: evolucao.registradoPor,
    registrado_em: evolucao.registradoEm,
  };
}

function paraRegistro(linha: LinhaAuditoria): RegistroAuditoria {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    entidade: linha.entidade as RegistroAuditoria["entidade"],
    entidadeId: linha.entidade_id,
    usuarioId: linha.usuario_id,
    acao: linha.acao as RegistroAuditoria["acao"],
    conteudoAnterior: linha.conteudo_anterior,
    registradoEm: linha.registrado_em,
  };
}

function paraLinhaAuditoria(registro: RegistroAuditoria): LinhaAuditoria {
  return {
    id: registro.id,
    clinica_id: registro.clinicaId,
    entidade: registro.entidade,
    entidade_id: registro.entidadeId,
    usuario_id: registro.usuarioId,
    acao: registro.acao,
    conteudo_anterior: registro.conteudoAnterior,
    registrado_em: registro.registradoEm,
  };
}

export function criarProntuario(): {
  anamneses: Anamneses;
  evolucoes: Evolucoes;
  auditoria: Auditoria;
  estoque: BaixaEstoque;
} {
  const admin = createAdminClient();

  const anamneses: Anamneses = {
    async buscar(pacienteId) {
      const { data, error } = await admin
        .from("anamneses")
        .select("*")
        .eq("paciente_id", pacienteId)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler a anamnese", error);
      return data ? paraAnamnese(data as LinhaAnamnese) : null;
    },

    async salvar(anamnese) {
      const { error } = await admin
        .from("anamneses")
        .upsert(paraLinhaAnamnese(anamnese), { onConflict: "paciente_id" });
      if (error) throw new ErroAplicacao("Não foi possível salvar a anamnese", error);
    },
  };

  const evolucoes: Evolucoes = {
    async buscar(agendamentoId) {
      const { data, error } = await admin
        .from("evolucoes")
        .select("*")
        .eq("agendamento_id", agendamentoId)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler a evolução", error);
      return data ? paraEvolucao(data as LinhaEvolucao) : null;
    },

    async listar(agendamentoIds) {
      if (agendamentoIds.length === 0) return [];
      const { data, error } = await admin
        .from("evolucoes")
        .select("*")
        .in("agendamento_id", agendamentoIds);
      if (error) throw new ErroAplicacao("Não foi possível listar as evoluções", error);
      return (data as LinhaEvolucao[]).map(paraEvolucao);
    },

    async salvar(evolucao) {
      const { error } = await admin
        .from("evolucoes")
        .upsert(paraLinhaEvolucao(evolucao), { onConflict: "agendamento_id" });
      if (error) throw new ErroAplicacao("Não foi possível salvar a evolução", error);
    },
  };

  const auditoria: Auditoria = {
    async registrar(registro) {
      const { error } = await admin.from("auditoria").insert(paraLinhaAuditoria(registro));
      if (error) throw new ErroAplicacao("Não foi possível registrar a auditoria", error);
    },

    async listar(clinicaId) {
      const { data, error } = await admin
        .from("auditoria")
        .select("*")
        .eq("clinica_id", clinicaId)
        .order("registrado_em", { ascending: true });
      if (error) throw new ErroAplicacao("Não foi possível listar a auditoria", error);
      return (data as LinhaAuditoria[]).map(paraRegistro);
    },
  };

  // Baixa temporária: não escreve estoque e não lança.
  const estoque: BaixaEstoque = {
    async baixar() {},
  };

  return { anamneses, evolucoes, auditoria, estoque };
}
