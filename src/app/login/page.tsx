import { Inter } from "next/font/google";
import { FormLogin } from "./form";
import { Marca } from "./marca";
import "./entrar.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export default function Page() {
  return (
    <main className={`entrar ${inter.className}`}>
      <Marca />
      <section className="entrar-painel">
        <div className="entrar-miolo">
          <FormLogin />
        </div>
        <p className="entrar-rodape">© 2026 denssalus · Sistema de agendamento odontológico</p>
      </section>
    </main>
  );
}
