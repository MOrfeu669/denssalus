import { LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Sessao } from "../domain/auth/tipos";
import { sair } from "./auth/actions";
import { gruposDaCasca, rotuloPapel } from "./casca-menu";
import { iniciaisDoNome } from "./casca-usuario";
import { MenuCasca } from "./menu-casca";

function Marca() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2 no-underline">
      <span className="grid size-8 place-items-center rounded-paper-md bg-paper-marca text-white" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 3C4.5 3 3 5 3 8c0 3 1.5 4.5 2 7 .5 3 1 6 2.5 6S9.5 15.5 12 15.5 15 21 16.5 21 18.5 18 19 15c.5-2.5 2-4 2-7 0-3-1.5-5-4-5-2 0-3 1-5 1s-2-1-5-1Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-heading text-[18px] leading-[26px] font-bold text-tinta">denssalus</span>
    </Link>
  );
}

export function LateralCasca({
  sessao,
  clinicaNome,
  contadores,
}: {
  sessao: Sessao;
  clinicaNome: string | null;
  contadores: Record<string, number>;
}) {
  const { nome, papel } = sessao.usuario;
  return (
    <aside className="casca-lateral sticky top-0 flex h-screen w-(--paper-lateral-largura) flex-col border-r border-borda-papel bg-card pt-[18px] pb-0 text-tinta max-[960px]:static max-[960px]:h-auto max-[960px]:w-full max-[960px]:border-r-0 max-[960px]:border-b">
      <div className="px-3">
        <Marca />
      </div>
      {clinicaNome ? (
        <div className="mx-3 mt-4 rounded-controle border border-borda-papel bg-paper-subtle px-3 py-1.5">
          <p className="m-0 truncate text-[13px] leading-[18px] font-medium text-tinta">{clinicaNome}</p>
        </div>
      ) : null}
      <MenuCasca grupos={gruposDaCasca(papel)} contadores={contadores} />
      <div className="mt-auto flex h-[72px] items-center gap-3 border-t border-borda-papel px-5">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full bg-paper-avatar-fundo font-heading text-xs font-semibold text-paper-status-agendado-tinta"
          aria-hidden="true"
        >
          {iniciaisDoNome(nome)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm leading-5 font-medium text-tinta">{nome}</span>
          <span className="block truncate text-xs leading-4 text-paper-ink-3">{rotuloPapel(papel)}</span>
        </span>
        <form action={sair}>
          <Button type="submit" variant="ghost" size="icon" aria-label="Sair" className="text-paper-ink-3">
            <LogOut aria-hidden="true" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
