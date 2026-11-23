import type { Dentista } from "../../domain/dentista/tipos";

export function filtrarDentistas(dentistas: readonly Dentista[], busca: string): Dentista[] {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  if (!termo) return [...dentistas];
  return dentistas.filter((dentista) =>
    dentista.nome.toLocaleLowerCase("pt-BR").includes(termo),
  );
}
