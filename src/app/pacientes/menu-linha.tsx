"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MenuLinha({
  id,
  nome,
  onEditar,
}: {
  id: string;
  nome: string;
  onEditar: (id: string) => void;
}) {
  const menuId = useId();
  const botao = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!pos) return;
    function fora(evento: MouseEvent) {
      const alvo = evento.target as Node;
      if (painel.current?.contains(alvo) || botao.current?.contains(alvo)) return;
      setPos(null);
    }
    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setPos(null);
        botao.current?.focus();
      }
    }
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [pos]);

  function alternar() {
    if (pos) {
      setPos(null);
      return;
    }
    const rect = botao.current?.getBoundingClientRect();
    if (!rect) return;
    const altura = 132;
    const top = window.innerHeight - rect.bottom < altura ? rect.top - altura : rect.bottom + 4;
    setPos({ top, left: Math.max(8, rect.right - 196) });
  }

  return (
    <>
      <button
        ref={botao}
        type="button"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8 text-paper-ink-2")}
        aria-label={`Ações de ${nome}`}
        aria-haspopup="menu"
        aria-expanded={pos !== null}
        aria-controls={pos ? menuId : undefined}
        onClick={alternar}
      >
        <MoreHorizontal aria-hidden="true" />
      </button>
      {pos ? (
        <div
          ref={painel}
          id={menuId}
          role="menu"
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-40 w-48 rounded-paper-md border border-borda-papel bg-card p-1 shadow-paper-overlay"
        >
          <Link
            role="menuitem"
            className="block rounded-paper-sm px-3 py-2 text-sm text-tinta no-underline hover:bg-paper-subtle"
            href={`/prontuarios/${id}`}
          >
            Prontuário
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full rounded-paper-sm px-3 py-2 text-left text-sm text-tinta hover:bg-paper-subtle"
            onClick={() => {
              setPos(null);
              onEditar(id);
            }}
          >
            Editar paciente
          </button>
          <Link
            role="menuitem"
            className="block rounded-paper-sm px-3 py-2 text-sm text-tinta no-underline hover:bg-paper-subtle"
            href={`/agendamentos?paciente=${id}`}
          >
            Agendar
          </Link>
        </div>
      ) : null}
    </>
  );
}
