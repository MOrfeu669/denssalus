import type { Dependencias as DependenciasPaciente } from "../../domain/paciente/portas";
import type {
  CanalComunicacao,
  Paciente,
  ResponsavelLegal,
  Sexo,
} from "../../domain/paciente/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type Pacientes = DependenciasPaciente["pacientes"];

type LinhaPaciente = {
  id: string;
  clinica_id: string;
  nome: string;
  cpf: string | null;
  endereco: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  responsavel_nome: string | null;
  responsavel_cpf: string | null;
  responsavel_telefone: string | null;
  canais: CanalComunicacao[];
};

function paraPaciente(linha: LinhaPaciente): Paciente {
  const responsavel: ResponsavelLegal | null =
    linha.responsavel_nome !== null && linha.responsavel_cpf !== null
      ? {
          nome: linha.responsavel_nome,
          cpf: linha.responsavel_cpf,
          telefone: linha.responsavel_telefone,
        }
      : null;

  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    nome: linha.nome,
    canais: linha.canais,
    cpf: linha.cpf,
    endereco: linha.endereco,
    dataNascimento: linha.data_nascimento,
    sexo: linha.sexo as Sexo | null,
    responsavel,
  };
}

function paraLinha(paciente: Paciente): LinhaPaciente {
  return {
    id: paciente.id,
    clinica_id: paciente.clinicaId,
    nome: paciente.nome,
    cpf: paciente.cpf,
    endereco: paciente.endereco,
    data_nascimento: paciente.dataNascimento,
    sexo: paciente.sexo,
    responsavel_nome: paciente.responsavel?.nome ?? null,
    responsavel_cpf: paciente.responsavel?.cpf ?? null,
    responsavel_telefone: paciente.responsavel?.telefone ?? null,
    canais: paciente.canais,
  };
}

export function criarPacientes(): Pacientes {
  const admin = createAdminClient();

  return {
    async listar(clinicaId) {
      const { data, error } = await admin
        .from("pacientes")
        .select("*")
        .eq("clinica_id", clinicaId);
      if (error) throw new ErroAplicacao("Não foi possível listar os pacientes", error);
      return (data as LinhaPaciente[])
        .map(paraPaciente)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    },

    async buscarPorId(id) {
      const { data, error } = await admin
        .from("pacientes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o paciente", error);
      return data ? paraPaciente(data as LinhaPaciente) : null;
    },

    async buscarPorCpf(clinicaId, cpf) {
      const { data, error } = await admin
        .from("pacientes")
        .select("*")
        .eq("clinica_id", clinicaId)
        .eq("cpf", cpf)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o paciente", error);
      return data ? paraPaciente(data as LinhaPaciente) : null;
    },

    async salvar(paciente) {
      const { error } = await admin.from("pacientes").upsert(paraLinha(paciente));
      if (error) throw new ErroAplicacao("Não foi possível salvar o paciente", error);
    },
  };
}
