import type { Procedimento } from "../../domain/procedimento/tipos";

export const PROCEDIMENTOS_POR_PAGINA = 15;

export function filtrarProcedimentos(
  procedimentos: readonly Procedimento[],
  busca: string,
): Procedimento[] {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  if (!termo) return [...procedimentos];
  return procedimentos.filter((procedimento) =>
    procedimento.nome.toLocaleLowerCase("pt-BR").includes(termo),
  );
}

export function paginaDe<T>(
  itens: readonly T[],
  pagina: number,
  tamanho = PROCEDIMENTOS_POR_PAGINA,
): { itens: T[]; temMais: boolean; total: number } {
  const segura = Math.max(1, pagina);
  const fim = segura * tamanho;
  return {
    itens: itens.slice(0, fim),
    temMais: fim < itens.length,
    total: itens.length,
  };
}
