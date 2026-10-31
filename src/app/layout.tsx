import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { Casca } from "./casca";
import { nomeDaClinica } from "./casca-clinica";
import { telaSemCasca } from "./casca-publico";
import "./globals.css";
import { sessaoAtual } from "./sessao";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Denssalus",
  description: "Gestão da clínica odontológica",
};

export default async function Layout({ children }: { children: ReactNode }) {
  const caminho = (await headers()).get("x-denssalus-caminho") ?? "";
  if (!caminho || telaSemCasca(caminho)) {
    return (
      <html lang="pt-BR">
        <body className={inter.className}>{children}</body>
      </html>
    );
  }

  let sessao = null;
  try {
    sessao = await sessaoAtual();
  } catch {
    sessao = null;
  }

  if (!sessao) {
    return (
      <html lang="pt-BR">
        <body className={inter.className}>{children}</body>
      </html>
    );
  }

  const clinicaNome = await nomeDaClinica(sessao);
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Casca sessao={sessao} clinicaNome={clinicaNome}>
          {children}
        </Casca>
      </body>
    </html>
  );
}
