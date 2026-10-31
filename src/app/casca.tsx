import { Inter } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
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
    <div className={`casca ${inter.className}`}>
      <aside className="casca-lateral">
        <Link className="casca-marca" href="/">
          denssalus
        </Link>
        {clinicaNome ? <p className="casca-clinica">{clinicaNome}</p> : null}
        <MenuCasca itens={menuDaCasca(papel)} />
        <div className="casca-usuario">
          <p className="casca-usuario-nome">{nome}</p>
          <p className="casca-usuario-papel">{rotuloPapel(papel)}</p>
          <form action={sair}>
            <button type="submit" className="casca-sair">
              Sair
            </button>
          </form>
        </div>
      </aside>
      <div className="casca-coluna">
        <div className="casca-topo">
          <Sino sessao={sessao} />
        </div>
        <main className="casca-miolo">{children}</main>
      </div>
    </div>
  );
}

export function CascaAberta({ children }: { children: ReactNode }) {
  return (
    <div className={`casca casca-aberta ${inter.className}`}>
      <main className="casca-miolo">{children}</main>
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
