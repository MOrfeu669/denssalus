import { Inter } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Sessao } from "../domain/auth/tipos";
import { lerBaseDaClinica } from "../domain/inicio/casos";
import { sair } from "./auth/actions";
import { menuDaCasca, rotuloPapel } from "./casca-menu";
import { dependenciasInicio } from "./dependencias";
import { MenuCasca } from "./menu-casca";
import { Sino } from "./sino";
import "./casca.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export async function Casca({
  sessao,
  clinicaNome,
  children,
}: {
  sessao: Sessao;
  clinicaNome: string | null;
  children: ReactNode;
}) {
  const { nome, papel } = sessao.usuario;
  return (
    <div
      className={cn(
        "casca grid min-h-screen grid-cols-[264px_1fr] bg-fundo text-sm leading-5 text-tinta max-[960px]:flex max-[960px]:flex-col",
        inter.className,
      )}
    >
      <aside className="casca-lateral sticky top-0 flex h-screen flex-col gap-2 bg-marca px-4 pt-7 pb-5 text-white max-[960px]:static max-[960px]:h-auto max-[960px]:py-5">
        <Link className="px-3 text-[22px] leading-[30px] font-bold text-white no-underline" href="/">
          denssalus
        </Link>
        {clinicaNome ? (
          <p className="px-3 pb-4 text-[13px] leading-[18px] font-normal wrap-anywhere text-nevoa">
            {clinicaNome}
          </p>
        ) : null}
        <MenuCasca itens={menuDaCasca(papel)} />
        <div className="mt-auto flex flex-col gap-0.5 border-t border-acao px-3 pt-4">
          <p className="text-sm leading-5 font-semibold wrap-anywhere">{nome}</p>
          <p className="text-xs leading-4 font-normal text-nevoa">{rotuloPapel(papel)}</p>
          <form action={sair} className="mt-3 block">
            <Button
              type="submit"
              variant="outline"
              className="h-10 w-full rounded-[10px] border-acao bg-transparent text-sm leading-5 font-semibold text-white shadow-none hover:bg-acao hover:text-white"
            >
              Sair
            </Button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <div className="flex justify-end px-6 pt-4">
          <Sino sessao={sessao} />
        </div>
        <main className="casca-miolo m-0 min-w-0 max-w-none rounded-none border-0 bg-fundo px-12 py-10 text-tinta max-[960px]:px-5 max-[960px]:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}

export function CascaAberta({ children }: { children: ReactNode }) {
  return (
    <div className={cn("casca grid min-h-screen grid-cols-1 bg-fundo text-sm leading-5 text-tinta", inter.className)}>
      <main className="casca-miolo m-0 min-w-0 max-w-none rounded-none border-0 bg-fundo px-12 py-10 text-tinta max-[960px]:px-5 max-[960px]:py-7">
        {children}
      </main>
    </div>
  );
}

export async function ComCasca({
  sessao,
  children,
}: {
  sessao: Sessao;
  children: ReactNode;
}) {
  let clinicaNome: string | null = null;
  try {
    const base = await lerBaseDaClinica(dependenciasInicio(), sessao);
    if (base.ok) clinicaNome = base.valor.nome;
  } catch {
    clinicaNome = null;
  }
  return (
    <Casca sessao={sessao} clinicaNome={clinicaNome}>
      {children}
    </Casca>
  );
}
