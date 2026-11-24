"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ItemMenu } from "./casca-menu";

export function MenuCasca({ itens }: { itens: ItemMenu[] }) {
  const caminho = usePathname();
  return (
    <nav className="min-h-0 flex-1 overflow-y-auto" aria-label="Áreas">
      <ul className="m-0 flex list-none flex-col gap-1 p-0 max-[960px]:flex-row max-[960px]:flex-wrap">
        {itens.map((item) => {
          const atual = caminho === item.href || caminho.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={atual ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm leading-5 font-semibold text-white no-underline hover:bg-sidebar-accent",
                  atual && "bg-sidebar-accent shadow-[inset_3px_0_0_var(--paper-secondary)]",
                )}
              >
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
