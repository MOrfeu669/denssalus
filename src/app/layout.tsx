import type { ReactNode } from "react";
import "./globals.css";
import { sessaoAtual } from "./sessao";
import { Sino } from "./sino";

export const metadata = {
  title: "Denssalus",
  description: "Gestão da clínica odontológica",
};

async function sessaoOuNada() {
  try {
    return await sessaoAtual();
  } catch {
    return null;
  }
}

export default async function Layout({ children }: { children: ReactNode }) {
  const sessao = await sessaoOuNada();

  return (
    <html lang="pt-BR">
      <body>
        {sessao ? <Sino sessao={sessao} /> : null}
        {children}
      </body>
    </html>
  );
}
