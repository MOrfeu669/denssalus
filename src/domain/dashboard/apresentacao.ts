import type { Agendamento, BloqueioAgenda } from "../agendamento/tipos";
import type { Clinica } from "../clinica/tipos";
import type { Debito } from "../debito/tipos";
import type { Dentista } from "../dentista/tipos";
import type { ItemPlano } from "../plano/tipos";
import type { Procedimento } from "../procedimento/tipos";
import type { Protese } from "../protese/tipos";
import type { ApresentacaoDashboard } from "./tipos";
import {
  calcularAReceber,
  calcularFaturamento,
  calcularOcupacao,
  contarProtesesNoPeriodo,
  lerMetaDiaria,
  periodoAnterior,
  serieDiaria,
  variacaoPercentual,
  variacaoPontos,
  type Lancamento,
  type Periodo,
} from "./regras";

type Totais = {
  faturado: number;
  recebido: number;
  ocupacao: number;
  porDentista: { dentistaId: string; valor: number }[];
  porProcedimento: { procedimentoId: string; valor: number }[];
  lancamentos: Lancamento[];
};

export function montarApresentacao(
  clinica: Clinica,
  periodo: Periodo,
  totais: Totais,
  fontes: {
    agendamentos: Agendamento[];
    itens: ItemPlano[];
    procedimentos: Procedimento[];
    dentistas: Dentista[];
    debitos: Debito[];
    proteses: Protese[];
    bloqueios: BloqueioAgenda[];
  },
): ApresentacaoDashboard {
  const anterior = periodoAnterior(periodo);
  const faturadoAnterior = calcularFaturamento(
    clinica.id,
    fontes.agendamentos,
    fontes.itens,
    fontes.procedimentos,
    anterior,
  ).faturado;
  const ocupacaoAnterior = calcularOcupacao(
    clinica,
    fontes.agendamentos,
    fontes.dentistas,
    fontes.bloqueios,
    anterior,
  );
  const nomesDentista = new Map(fontes.dentistas.filter((d) => d.clinicaId === clinica.id).map((d) => [d.id, d]));
  const nomesProcedimento = new Map(
    fontes.procedimentos.filter((p) => p.clinicaId === clinica.id).map((p) => [p.id, p.nome]),
  );
  const quantidades = new Map<string, number>();
  for (const item of totais.lancamentos) {
    quantidades.set(item.procedimentoId, (quantidades.get(item.procedimentoId) ?? 0) + 1);
  }
  const procedimentos = [...totais.porProcedimento]
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6)
    .map((item) => ({
      procedimentoId: item.procedimentoId,
      nome: nomesProcedimento.get(item.procedimentoId) ?? item.procedimentoId,
      quantidade: quantidades.get(item.procedimentoId) ?? 0,
      valor: item.valor,
      participacao: totais.faturado > 0 ? (item.valor / totais.faturado) * 100 : 0,
    }));

  return {
    diario: serieDiaria(clinica, totais.lancamentos, periodo),
    metaDiaria: lerMetaDiaria(clinica),
    aReceber: calcularAReceber(clinica.id, fontes.debitos),
    dentistas: totais.porDentista.map((item) => {
      const dentista = nomesDentista.get(item.dentistaId);
      return {
        dentistaId: item.dentistaId,
        nome: dentista?.nome ?? item.dentistaId,
        especialidade: dentista?.especialidades[0] ?? "",
        valor: item.valor,
      };
    }),
    procedimentos,
    variacaoFaturado: variacaoPercentual(totais.faturado, faturadoAnterior),
    variacaoOcupacao: variacaoPontos(totais.ocupacao, ocupacaoAnterior),
    parteRecebida: totais.faturado > 0 ? (totais.recebido / totais.faturado) * 100 : null,
    trabalhosProtese: contarProtesesNoPeriodo(clinica.id, fontes.proteses, periodo),
  };
}
