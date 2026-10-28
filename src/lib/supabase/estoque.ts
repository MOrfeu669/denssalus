import type { Dependencias } from "../../domain/estoque/portas";
import type {
  AvisoEstoque,
  Lote,
  Material,
  Movimentacao,
  VinculoMaterial,
} from "../../domain/estoque/tipos";

type Materiais = Dependencias["materiais"];
type Lotes = Dependencias["lotes"];
type Vinculos = Dependencias["vinculos"];
type Movimentacoes = Dependencias["movimentacoes"];
type Avisos = Dependencias["avisos"];
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type LinhaMaterial = {
  id: string;
  clinica_id: string;
  nome: string;
  quantidade_minima: number;
};

type LinhaLote = {
  id: string;
  material_id: string;
  quantidade: number;
  validade: string;
  criado_em: string;
};

type LinhaVinculo = {
  procedimento_id: string;
  material_id: string;
  quantidade: number;
};

type LinhaMovimentacao = {
  id: string;
  clinica_id: string;
  material_id: string;
  lote_id: string;
  tipo: string;
  quantidade: number;
  usuario_id: string | null;
  agendamento_id: string | null;
  registrado_em: string;
};

function paraMaterial(linha: LinhaMaterial): Material {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    nome: linha.nome,
    quantidadeMinima: linha.quantidade_minima,
  };
}

function paraLote(linha: LinhaLote): Lote {
  return {
    id: linha.id,
    materialId: linha.material_id,
    quantidade: linha.quantidade,
    validade: linha.validade.slice(0, 10),
    criadoEm: new Date(linha.criado_em).toISOString(),
  };
}

function paraVinculo(linha: LinhaVinculo): VinculoMaterial {
  return {
    procedimentoId: linha.procedimento_id,
    materialId: linha.material_id,
    quantidade: linha.quantidade,
  };
}

function paraMovimentacao(linha: LinhaMovimentacao): Movimentacao {
  return {
    id: linha.id,
    materialId: linha.material_id,
    loteId: linha.lote_id,
    tipo: linha.tipo as Movimentacao["tipo"],
    quantidade: linha.quantidade,
    usuarioId: linha.usuario_id,
    agendamentoId: linha.agendamento_id,
    registradoEm: new Date(linha.registrado_em).toISOString(),
  };
}

export function criarEstoque(): {
  materiais: Materiais;
  lotes: Lotes;
  vinculos: Vinculos;
  movimentacoes: Movimentacoes;
  avisos: Avisos;
} {
  const admin = createAdminClient();

  async function clinicaDoMaterial(materialId: string): Promise<string> {
    const { data, error } = await admin
      .from("materiais")
      .select("clinica_id")
      .eq("id", materialId)
      .single();
    if (error) throw new ErroAplicacao("Não foi possível ler o material", error);
    return (data as { clinica_id: string }).clinica_id;
  }

  const materiais: Materiais = {
    async listar(clinicaId) {
      const { data, error } = await admin
        .from("materiais")
        .select("*")
        .eq("clinica_id", clinicaId);
      if (error) throw new ErroAplicacao("Não foi possível listar os materiais", error);
      return (data as LinhaMaterial[]).map(paraMaterial);
    },

    async buscarPorId(id) {
      const { data, error } = await admin
        .from("materiais")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o material", error);
      return data ? paraMaterial(data as LinhaMaterial) : null;
    },

    async buscarPorNome(clinicaId, nome) {
      const { data, error } = await admin
        .from("materiais")
        .select("*")
        .eq("clinica_id", clinicaId)
        .eq("nome", nome)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o material", error);
      return data ? paraMaterial(data as LinhaMaterial) : null;
    },

    async salvar(material) {
      const { error } = await admin.from("materiais").upsert(
        {
          id: material.id,
          clinica_id: material.clinicaId,
          nome: material.nome,
          quantidade_minima: material.quantidadeMinima,
        },
        { onConflict: "id" },
      );
      if (error?.code === "23505") throw new ErroAplicacao("Material já cadastrado", error);
      if (error) throw new ErroAplicacao("Não foi possível salvar o material", error);
    },
  };

  const lotes: Lotes = {
    async listarPorMaterial(materialId) {
      const { data, error } = await admin
        .from("lotes_material")
        .select("*")
        .eq("material_id", materialId);
      if (error) throw new ErroAplicacao("Não foi possível listar os lotes", error);
      return (data as LinhaLote[]).map(paraLote);
    },

    async salvar(lote) {
      const { error } = await admin.from("lotes_material").upsert(
        {
          id: lote.id,
          material_id: lote.materialId,
          quantidade: lote.quantidade,
          validade: lote.validade,
          criado_em: lote.criadoEm,
        },
        { onConflict: "id" },
      );
      if (error) throw new ErroAplicacao("Não foi possível salvar o lote", error);
    },
  };

  const vinculos: Vinculos = {
    async listarPorProcedimento(procedimentoId) {
      const { data, error } = await admin
        .from("procedimento_materiais")
        .select("*")
        .eq("procedimento_id", procedimentoId);
      if (error) throw new ErroAplicacao("Não foi possível listar os vínculos", error);
      return (data as LinhaVinculo[]).map(paraVinculo);
    },

    async salvar(vinculo) {
      const { error } = await admin.from("procedimento_materiais").upsert(
        {
          procedimento_id: vinculo.procedimentoId,
          material_id: vinculo.materialId,
          quantidade: vinculo.quantidade,
        },
        { onConflict: "procedimento_id,material_id" },
      );
      if (error) throw new ErroAplicacao("Não foi possível salvar o vínculo", error);
    },
  };

  const movimentacoes: Movimentacoes = {
    async listar(materialId) {
      const { data, error } = await admin
        .from("movimentacoes_estoque")
        .select("*")
        .eq("material_id", materialId)
        .order("registrado_em", { ascending: true });
      if (error) throw new ErroAplicacao("Não foi possível listar as movimentações", error);
      return (data as LinhaMovimentacao[]).map(paraMovimentacao);
    },

    async registrar(movimentacao) {
      const clinicaId = await clinicaDoMaterial(movimentacao.materialId);
      const { error } = await admin.from("movimentacoes_estoque").insert({
        id: movimentacao.id,
        clinica_id: clinicaId,
        material_id: movimentacao.materialId,
        lote_id: movimentacao.loteId,
        tipo: movimentacao.tipo,
        quantidade: movimentacao.quantidade,
        usuario_id: movimentacao.usuarioId ?? null,
        agendamento_id: movimentacao.agendamentoId ?? null,
        registrado_em: movimentacao.registradoEm,
      });
      if (error) throw new ErroAplicacao("Não foi possível registrar a movimentação", error);
    },
  };

  const avisos: Avisos = {
    async existeMinimo(materialId) {
      const { data, error } = await admin
        .from("avisos_estoque")
        .select("id")
        .eq("material_id", materialId)
        .eq("tipo", "estoque_minimo")
        .limit(1);
      if (error) throw new ErroAplicacao("Não foi possível ler os avisos de estoque", error);
      return (data ?? []).length > 0;
    },

    async registrar(aviso: AvisoEstoque) {
      const clinicaId = await clinicaDoMaterial(aviso.materialId);
      const { error } = await admin.from("avisos_estoque").insert({
        id: aviso.id,
        clinica_id: clinicaId,
        material_id: aviso.materialId,
        tipo: aviso.tipo,
        texto: aviso.texto,
      });
      if (error) throw new ErroAplicacao("Não foi possível registrar o aviso de estoque", error);
    },
  };

  return { materiais, lotes, vinculos, movimentacoes, avisos };
}
