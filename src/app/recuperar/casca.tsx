import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { tipografiaCasca } from "../tipografia-paper";
import "./recuperar.css";

export function Casca({ children }: { children: ReactNode }) {
  return (
    <main className={cn("recuperar", tipografiaCasca)}>
      <section className="recuperar-painel">
        <p className="recuperar-marca">denssalus</p>
        {children}
        <p className="recuperar-rodape">© 2026 denssalus · Sistema de agendamento odontológico</p>
      </section>
    </main>
  );
}
