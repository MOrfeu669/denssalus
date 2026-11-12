import { Inter, Geist } from "next/font/google";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { Casca } from "./casca";
import { nomeDaClinica } from "./casca-clinica";
import { telaSemCasca } from "./casca-publico";
import "./globals.css";
import { sessaoAtual } from "./sessao";
import { BotaoVoz } from "./voz/botao-voz";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
      <html lang="pt-BR" className={cn("font-sans", geist.variable)}>
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
      <html lang="pt-BR" className={cn("font-sans", geist.variable)}>
        <body className={inter.className}>{children}</body>
      </html>
    );
  }

  const clinicaNome = await nomeDaClinica(sessao);
  return (
    <html lang="pt-BR" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <Casca sessao={sessao} clinicaNome={clinicaNome}>
          {children}
        </Casca>
        <BotaoVoz nomeUsuario={sessao.usuario.nome} papel={sessao.usuario.papel} />
      </body>
    </html>
  );
}
