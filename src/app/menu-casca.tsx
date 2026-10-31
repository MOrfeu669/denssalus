"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ItemMenu } from "./casca-menu";

export function MenuCasca({ itens }: { itens: ItemMenu[] }) {
  const caminho = usePathname();
  return (
    <nav className="casca-menu" aria-label="Áreas">
      <ul>
        {itens.map((item) => {
          const atual = caminho === item.href || caminho.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={atual ? "page" : undefined}>
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
