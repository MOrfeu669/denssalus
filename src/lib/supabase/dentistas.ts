import type { Dependencias as DependenciasDentista } from "../../domain/dentista/portas";
import type { Dentista } from "../../domain/dentista/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type Dentistas = DependenciasDentista["dentistas"];

type LinhaDentista = {
  id: string;
  usuario_id: string;
  clinica_id: string;
  nome: string;
  cro: string;
  telefone: string;
  cpf: string;
  especialidades: string[];
  ativo: boolean;
};

function paraDentista(linha: LinhaDentista): Dentista {
  return {
    id: linha.id,
    usuarioId: linha.usuario_id,
    clinicaId: linha.clinica_id,
    nome: linha.nome,
    cro: linha.cro,
    telefone: linha.telefone,
    cpf: linha.cpf,
    especialidades: linha.especialidades,
    ativo: linha.ativo,
  };
}

function paraLinha(dentista: Dentista): LinhaDentista {
  return {
    id: dentista.id,
    usuario_id: dentista.usuarioId,
    clinica_id: dentista.clinicaId,
    nome: dentista.nome,
    cro: dentista.cro,
    telefone: dentista.telefone,
    cpf: dentista.cpf,
    especialidades: dentista.especialidades,
    ativo: dentista.ativo,
  };
}

export function criarDentistas(): Dentistas {
  const admin = createAdminClient();

  return {
    async listar(clinicaId) {
      const { data, error } = await admin
        .from("dentistas")
        .select("*")
        .eq("clinica_id", clinicaId);
      if (error) throw new ErroAplicacao("Não foi possível listar os dentistas", error);
      return (data as LinhaDentista[])
        .map(paraDentista)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    },

    async buscarPorId(id) {
      const { data, error } = await admin
        .from("dentistas")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o dentista", error);
      return data ? paraDentista(data as LinhaDentista) : null;
    },

    async salvar(dentista) {
      const { error } = await admin.from("dentistas").upsert(paraLinha(dentista));
      if (error) throw new ErroAplicacao("Não foi possível salvar o dentista", error);
    },
  };
}
