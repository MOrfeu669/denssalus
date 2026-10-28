import type { Agendamento } from "../agendamento/tipos";
import { autorizarAcao } from "../auth/casos";
import type { Acao, Sessao } from "../auth/tipos";
import { MENSAGEM_CLINICA_NAO_ENCONTRADA } from "../clinica/tipos";
import type { Dependencias } from "./portas";
import { loteVencido, lotesValidos, somarQuantidade, textoEstoqueMinimo } from "./regras";
import type { Lote, Material } from "./tipos";

type Falha = { ok: false; mensagem: string };

export async function clinicaDaSessao(
  deps: Dependencias,
  ator: Sessao,
  acao: Acao,
): Promise<{ ok: true; clinicaId: string } | Falha> {
  const permitido = autorizarAcao(ator, acao);
  if (!permitido.ok) return permitido;

  const clinica = await deps.clinicas.buscarPorId(ator.usuario.clinicaId);
  if (!clinica) return { ok: false, mensagem: MENSAGEM_CLINICA_NAO_ENCONTRADA };
  return { ok: true, clinicaId: clinica.id };
}

export async function materialDaClinica(
  deps: Dependencias,
  clinicaId: string,
  materialId: string,
): Promise<Material | null> {
  const material = await deps.materiais.buscarPorId(materialId);
  if (!material || material.clinicaId !== clinicaId) return null;
  return material;
}

export async function purgarVencidos(
  deps: Dependencias,
  material: Material,
  hoje: Date,
): Promise<Lote[]> {
  const lotes = await deps.lotes.listarPorMaterial(material.id);
  const atualizados: Lote[] = [];
  for (const lote of lotes) {
    if (lote.quantidade > 0 && loteVencido(lote, hoje)) {
      await deps.movimentacoes.registrar({
        id: deps.ids.novo(),
        materialId: material.id,
        loteId: lote.id,
        tipo: "vencimento",
        quantidade: lote.quantidade,
        usuarioId: null,
        agendamentoId: null,
        registradoEm: hoje.toISOString(),
      });
      const zerado = { ...lote, quantidade: 0 };
      await deps.lotes.salvar(zerado);
      atualizados.push(zerado);
    } else {
      atualizados.push(lote);
    }
  }
  return atualizados;
}

export async function verificarMinimo(
  deps: Dependencias,
  material: Material,
  lotes: Lote[],
  hoje: Date,
): Promise<number> {
  const quantidadeValida = somarQuantidade(lotesValidos(lotes, hoje));
  if (quantidadeValida < material.quantidadeMinima && !(await deps.avisos.existeMinimo(material.id))) {
    await deps.avisos.registrar({
      id: deps.ids.novo(),
      materialId: material.id,
      tipo: "estoque_minimo",
      texto: textoEstoqueMinimo(material.nome, quantidadeValida),
    });
  }
  return quantidadeValida;
}

export async function materiaisDoAtendimento(
  deps: Dependencias,
  agendamento: Agendamento,
): Promise<Map<string, number>> {
  const itens = await deps.itensPlano.listarPorAgendamento(agendamento.clinicaId, agendamento.id);
  const procedimentoIds = itens.length
    ? itens.map((item) => item.procedimentoId)
    : agendamento.procedimentoId
      ? [agendamento.procedimentoId]
      : [];

  const totais = new Map<string, number>();
  for (const procedimentoId of procedimentoIds) {
    for (const vinculo of await deps.vinculos.listarPorProcedimento(procedimentoId)) {
      totais.set(vinculo.materialId, (totais.get(vinculo.materialId) ?? 0) + vinculo.quantidade);
    }
  }
  return totais;
}
