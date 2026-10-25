import type { Dependencias as DependenciasClinica } from "../../domain/clinica/portas";
import type { Cadeira, Clinica, Dia } from "../../domain/clinica/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type Clinicas = DependenciasClinica["clinicas"];
type Cadeiras = DependenciasClinica["cadeiras"];

type LinhaClinica = {
  id: string;
  nome: string;
  admin_id: string;
  dias_atendimento: string[];
  horario_abertura: string;
  horario_fechamento: string;
};

type LinhaCadeira = {
  id: string;
  clinica_id: string;
  identificacao: string;
  ativa: boolean;
};

// O Postgres devolve `time` como HH:MM:SS; o domínio usa HH:MM.
function hhmm(horario: string): string {
  return horario.slice(0, 5);
}

function paraClinica(linha: LinhaClinica): Clinica {
  return {
    id: linha.id,
    nome: linha.nome,
    adminId: linha.admin_id,
    diasAtendimento: linha.dias_atendimento as Dia[],
    horarioAbertura: hhmm(linha.horario_abertura),
    horarioFechamento: hhmm(linha.horario_fechamento),
  };
}

function paraLinhaClinica(clinica: Clinica): LinhaClinica {
  return {
    id: clinica.id,
    nome: clinica.nome,
    admin_id: clinica.adminId,
    dias_atendimento: clinica.diasAtendimento,
    horario_abertura: clinica.horarioAbertura,
    horario_fechamento: clinica.horarioFechamento,
  };
}

function paraCadeira(linha: LinhaCadeira): Cadeira {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    identificacao: linha.identificacao,
    ativa: linha.ativa,
  };
}

function paraLinhaCadeira(cadeira: Cadeira): LinhaCadeira {
  return {
    id: cadeira.id,
    clinica_id: cadeira.clinicaId,
    identificacao: cadeira.identificacao,
    ativa: cadeira.ativa,
  };
}

export function criarClinicas(): Clinicas {
  const admin = createAdminClient();

  return {
    async buscarPorAdmin(adminId) {
      const { data, error } = await admin
        .from("clinicas")
        .select("*")
        .eq("admin_id", adminId)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler a clínica", error);
      return data ? paraClinica(data as LinhaClinica) : null;
    },

    async salvar(clinica) {
      const { error } = await admin.from("clinicas").upsert(paraLinhaClinica(clinica));
      if (error) throw new ErroAplicacao("Não foi possível salvar a clínica", error);
    },

    async remover(id) {
      const { error } = await admin.from("clinicas").delete().eq("id", id);
      if (error) throw new ErroAplicacao("Não foi possível remover a clínica", error);
    },
  };
}

export function criarCadeiras(): Cadeiras {
  const admin = createAdminClient();

  return {
    async listar(clinicaId) {
      const { data, error } = await admin
        .from("cadeiras")
        .select("*")
        .eq("clinica_id", clinicaId);
      if (error) throw new ErroAplicacao("Não foi possível listar as cadeiras", error);
      // Ordem natural: "Cadeira 2" antes de "Cadeira 10".
      return (data as LinhaCadeira[])
        .map(paraCadeira)
        .sort((a, b) => a.identificacao.localeCompare(b.identificacao, "pt-BR", { numeric: true }));
    },

    async salvar(cadeira) {
      const { error } = await admin.from("cadeiras").upsert(paraLinhaCadeira(cadeira));
      if (error) throw new ErroAplicacao("Não foi possível salvar a cadeira", error);
    },

    async removerDaClinica(clinicaId) {
      const { error } = await admin.from("cadeiras").delete().eq("clinica_id", clinicaId);
      if (error) throw new ErroAplicacao("Não foi possível remover as cadeiras", error);
    },
  };
}
