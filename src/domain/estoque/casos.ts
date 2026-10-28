import type { Resultado, Sessao } from "../auth/tipos";
import { MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO } from "../procedimento/tipos";
import { clinicaDaSessao, materialDaClinica, purgarVencidos, verificarMinimo } from "./apoio";
import type { Dependencias } from "./portas";
import { inteiroPositivo, validarLote, validarMaterial } from "./regras";
import {
  MENSAGEM_MATERIAL_JA_CADASTRADO,
  MENSAGEM_MATERIAL_NAO_ENCONTRADO,
  MENSAGEM_QUANTIDADE,
  type EntradaLote,
  type EntradaMaterial,
  type EntradaVinculo,
  type Lote,
  type Material,
  type MaterialListado,
  type Movimentacao,
  type VinculoMaterial,
} from "./tipos";

export { baixarPorAtendimento, listarMateriaisDaConsulta } from "./atendimento";

async function registrarEntrada(
  deps: Dependencias,
  material: Material,
  entrada: EntradaLote,
  usuarioId: string,
  hoje: Date,
): Promise<Lote> {
  const instante = hoje.toISOString();
  const lote: Lote = {
    id: deps.ids.novo(),
    materialId: material.id,
    quantidade: entrada.quantidade,
    validade: entrada.validade,
    criadoEm: instante,
  };
  await deps.lotes.salvar(lote);
  await deps.movimentacoes.registrar({
    id: deps.ids.novo(),
    materialId: material.id,
    loteId: lote.id,
    tipo: "entrada",
    quantidade: lote.quantidade,
    usuarioId,
    agendamentoId: null,
    registradoEm: instante,
  });
  return lote;
}

export async function criarMaterial(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaMaterial,
  hoje: Date,
): Promise<Resultado<Material>> {
  const contexto = await clinicaDaSessao(deps, ator, "estoque:gerir");
  if (!contexto.ok) return contexto;

  const dados = validarMaterial(entrada);
  if (!dados.ok) return dados;

  const repetido = await deps.materiais.buscarPorNome(contexto.clinicaId, dados.valor.nome);
  if (repetido) return { ok: false, mensagem: MENSAGEM_MATERIAL_JA_CADASTRADO };

  const material: Material = {
    id: deps.ids.novo(),
    clinicaId: contexto.clinicaId,
    nome: dados.valor.nome,
    quantidadeMinima: dados.valor.quantidadeMinima,
  };
  await deps.materiais.salvar(material);
  const lote = await registrarEntrada(deps, material, dados.valor, ator.usuario.id, hoje);
  await verificarMinimo(deps, material, [lote], hoje);
  return { ok: true, valor: material };
}

export async function reabastecer(
  deps: Dependencias,
  ator: Sessao,
  materialId: string,
  entrada: EntradaLote,
  hoje: Date,
): Promise<Resultado<Lote>> {
  const contexto = await clinicaDaSessao(deps, ator, "estoque:gerir");
  if (!contexto.ok) return contexto;

  const material = await materialDaClinica(deps, contexto.clinicaId, materialId);
  if (!material) return { ok: false, mensagem: MENSAGEM_MATERIAL_NAO_ENCONTRADO };

  const dados = validarLote(entrada);
  if (!dados.ok) return dados;

  await purgarVencidos(deps, material, hoje);
  const lote = await registrarEntrada(deps, material, dados.valor, ator.usuario.id, hoje);
  await verificarMinimo(deps, material, await deps.lotes.listarPorMaterial(material.id), hoje);
  return { ok: true, valor: lote };
}

export async function vincularMaterial(
  deps: Dependencias,
  ator: Sessao,
  entrada: EntradaVinculo,
): Promise<Resultado<VinculoMaterial>> {
  const contexto = await clinicaDaSessao(deps, ator, "estoque:gerir");
  if (!contexto.ok) return contexto;

  if (!inteiroPositivo(entrada.quantidade)) return { ok: false, mensagem: MENSAGEM_QUANTIDADE };

  const procedimento = await deps.procedimentos.buscarPorId(entrada.procedimentoId);
  if (!procedimento || procedimento.clinicaId !== contexto.clinicaId) {
    return { ok: false, mensagem: MENSAGEM_PROCEDIMENTO_NAO_ENCONTRADO };
  }
  const material = await materialDaClinica(deps, contexto.clinicaId, entrada.materialId);
  if (!material) return { ok: false, mensagem: MENSAGEM_MATERIAL_NAO_ENCONTRADO };

  const vinculo: VinculoMaterial = {
    procedimentoId: procedimento.id,
    materialId: material.id,
    quantidade: entrada.quantidade,
  };
  await deps.vinculos.salvar(vinculo);
  return { ok: true, valor: vinculo };
}

export async function listarMateriais(
  deps: Dependencias,
  ator: Sessao,
  hoje: Date,
): Promise<Resultado<MaterialListado[]>> {
  const contexto = await clinicaDaSessao(deps, ator, "estoque:gerir");
  if (!contexto.ok) return contexto;

  const lista = (await deps.materiais.listar(contexto.clinicaId))
    .filter((item) => item.clinicaId === contexto.clinicaId)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const listados: MaterialListado[] = [];
  for (const material of lista) {
    const lotes = await purgarVencidos(deps, material, hoje);
    const quantidade = await verificarMinimo(deps, material, lotes, hoje);
    listados.push({ ...material, quantidade });
  }
  return { ok: true, valor: listados };
}

export async function historico(
  deps: Dependencias,
  ator: Sessao,
  materialId: string,
  hoje: Date,
): Promise<Resultado<Movimentacao[]>> {
  const contexto = await clinicaDaSessao(deps, ator, "estoque:gerir");
  if (!contexto.ok) return contexto;

  const material = await materialDaClinica(deps, contexto.clinicaId, materialId);
  if (!material) return { ok: false, mensagem: MENSAGEM_MATERIAL_NAO_ENCONTRADO };

  const lotes = await purgarVencidos(deps, material, hoje);
  await verificarMinimo(deps, material, lotes, hoje);
  const movimentacoes = await deps.movimentacoes.listar(material.id);
  return {
    ok: true,
    valor: [...movimentacoes].sort((a, b) =>
      a.registradoEm < b.registradoEm ? -1 : a.registradoEm > b.registradoEm ? 1 : 0,
    ),
  };
}
