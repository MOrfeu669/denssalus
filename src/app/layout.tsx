import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Denssalus",
  description: "Gestão da clínica odontológica",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
