import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Marca } from "../login/marca";
import "../login/entrar.css";
import "./recuperar.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export function Casca({ children }: { children: ReactNode }) {
  return (
    <main className={`entrar ${inter.className}`}>
      <Marca />
      <section className="entrar-painel">
        <div className="entrar-miolo">{children}</div>
        <p className="entrar-rodape">© 2026 denssalus · Sistema de agendamento odontológico</p>
      </section>
    </main>
  );
}
