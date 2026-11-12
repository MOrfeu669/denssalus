import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { FormLogin } from "./form";
import { Marca } from "./marca";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export default function Page() {
  return (
    <main
      className={cn(
        "m-0 grid min-h-screen max-w-none grid-cols-2 rounded-none border-0 bg-fundo p-0 text-tinta max-[960px]:flex max-[960px]:flex-col",
        inter.className,
      )}
    >
      <Marca />
      <section className="flex min-h-screen flex-col bg-white max-[960px]:min-h-0">
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <FormLogin />
        </div>
        <p className="m-0 px-6 pb-8 text-center text-xs leading-4 font-normal text-placeholder">
          © 2026 denssalus · Sistema de agendamento odontológico
        </p>
      </section>
    </main>
  );
}
