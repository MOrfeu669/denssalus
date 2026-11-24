import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Sessao } from "../domain/auth/tipos";
import { lerBaseDaClinica } from "../domain/inicio/casos";
import { CabecalhoCasca } from "./casca-cabecalho";
import { contadoresDaLateral } from "./casca-contadores";
import { LateralCasca } from "./casca-lateral";
import { dependenciasInicio } from "./dependencias";
import { tipografiaCasca } from "./tipografia-paper";
import "./casca.css";

export async function Casca({
  sessao,
  clinicaNome,
  contadores,
  children,
}: {
  sessao: Sessao;
  clinicaNome: string | null;
  contadores?: Record<string, number>;
  children: ReactNode;
}) {
  const selos = contadores ?? (await contadoresDaLateral(sessao));
  return (
    <div
      className={cn(
        "casca grid min-h-screen grid-cols-[var(--paper-lateral-largura)_minmax(0,1fr)] bg-fundo text-sm leading-5 text-tinta max-[960px]:flex max-[960px]:flex-col",
        tipografiaCasca,
      )}
    >
      <LateralCasca sessao={sessao} clinicaNome={clinicaNome} contadores={selos} />
      <div className="flex min-w-0 flex-col">
        <CabecalhoCasca sessao={sessao} />
        <main className="casca-miolo m-0 min-w-0 max-w-none rounded-none border-0 bg-fundo px-8 py-8 text-tinta max-[960px]:px-4 max-[960px]:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function CascaAberta({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "casca grid min-h-screen grid-cols-1 bg-fundo text-sm leading-5 text-tinta",
        tipografiaCasca,
      )}
    >
      <main className="casca-miolo m-0 min-w-0 max-w-none rounded-none border-0 bg-fundo px-8 py-8 text-tinta max-[960px]:px-4 max-[960px]:py-6">
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
