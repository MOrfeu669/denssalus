import type { ReactNode } from "react";
import type { Sessao } from "../domain/auth/tipos";
import { BuscaGlobal } from "./busca/busca-global";
import { Sino } from "./sino";
import { AtalhoVoz } from "./voz/atalho";

export function CabecalhoCasca({
  sessao,
  busca,
  sino,
}: {
  sessao?: Sessao;
  busca?: ReactNode;
  sino?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-end gap-4 border-b border-borda-papel bg-fundo px-8 max-[960px]:px-4">
      {busca ?? <BuscaGlobal />}
      <AtalhoVoz />
      {sino ?? (sessao ? <Sino sessao={sessao} /> : null)}
    </header>
  );
}
