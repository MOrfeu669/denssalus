import { MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO } from "../agendamento/tipos";
import type { Resultado, Sessao } from "../auth/tipos";
import {
  clinicaDaSessao,
  materialDaClinica,
  materiaisDoAtendimento,
  purgarVencidos,
  verificarMinimo,
} from "./apoio";
import type { Dependencias } from "./portas";
import { inteiroNaoNegativo, lotesValidos, planejarConsumo, textoEstoqueInsuficiente } from "./regras";
import type { AjusteBaixa, MaterialDaConsulta } from "./tipos";

export async function baixarPorAtendimento(
  deps: Dependencias,
  agendamentoId: string,
  ajustes: AjusteBaixa[],
  usuarioId: string,
  hoje: Date,
): Promise<void> {
  const agendamento = await deps.agendamentos.buscarPorId(agendamentoId);
  if (!agendamento) return;

  const totais = await materiaisDoAtendimento(deps, agendamento);
  for (const ajuste of ajustes) {
    if (totais.has(ajuste.materialId) && inteiroNaoNegativo(ajuste.quantidade)) {
      totais.set(ajuste.materialId, ajuste.quantidade);
    }
  }

  for (const [materialId, pedido] of totais) {
    const material = await materialDaClinica(deps, agendamento.clinicaId, materialId);
    if (!material) continue;

    const lotes = await purgarVencidos(deps, material, hoje);
    const { consumos, faltou } = planejarConsumo(lotesValidos(lotes, hoje), pedido);
    const saldos = new Map(lotes.map((lote) => [lote.id, lote]));
    for (const { lote, quantidade } of consumos) {
      const restante = { ...lote, quantidade: lote.quantidade - quantidade };
      await deps.lotes.salvar(restante);
      saldos.set(lote.id, restante);
      await deps.movimentacoes.registrar({
        id: deps.ids.novo(),
        materialId: material.id,
        loteId: lote.id,
        tipo: "baixa",
        quantidade,
        usuarioId,
        agendamentoId: agendamento.id,
        registradoEm: hoje.toISOString(),
      });
    }
    if (faltou > 0) {
      await deps.avisos.registrar({
        id: deps.ids.novo(),
        materialId: material.id,
        tipo: "estoque_insuficiente",
        texto: textoEstoqueInsuficiente(material.nome, faltou),
      });
    }
    await verificarMinimo(deps, material, [...saldos.values()], hoje);
  }
}

export async function listarMateriaisDaConsulta(
  deps: Dependencias,
  ator: Sessao,
  agendamentoId: string,
  hoje: Date,
): Promise<Resultado<MaterialDaConsulta[]>> {
  const contexto = await clinicaDaSessao(deps, ator, "evolucao:registrar");
  if (!contexto.ok) return contexto;

  const agendamento = await deps.agendamentos.buscarPorId(agendamentoId);
  if (!agendamento || agendamento.clinicaId !== contexto.clinicaId) {
    return { ok: false, mensagem: MENSAGEM_AGENDAMENTO_NAO_ENCONTRADO };
  }

  const materiais: MaterialDaConsulta[] = [];
  for (const [materialId, quantidade] of await materiaisDoAtendimento(deps, agendamento)) {
    const material = await materialDaClinica(deps, contexto.clinicaId, materialId);
    if (!material) continue;
    const lotes = await purgarVencidos(deps, material, hoje);
    await verificarMinimo(deps, material, lotes, hoje);
    materiais.push({ materialId, nome: material.nome, quantidade });
  }
  materiais.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return { ok: true, valor: materiais };
}
