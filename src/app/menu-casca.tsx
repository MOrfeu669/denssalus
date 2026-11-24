"use client";

import {
  Building2,
  Calendar,
  ChartColumn,
  ClipboardList,
  FlaskConical,
  Home,
  MessageSquare,
  Mic,
  Package,
  RotateCcw,
  Shield,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { GrupoMenu, ItemMenu } from "./casca-menu";

const ICONES: Record<string, LucideIcon> = {
  "/": Home,
  "/agenda": Calendar,
  "/pacientes": Users,
  "/retornos": RotateCcw,
  "/procedimentos": ClipboardList,
  "/dentistas": UserCheck,
  "/laboratorios": FlaskConical,
  "/estoque": Package,
  "/dashboard": ChartColumn,
  "/mensagens": MessageSquare,
  "/usuarios": Shield,
  "/clinica": Building2,
  "/voz": Mic,
};

function atual(caminho: string, href: string): boolean {
  if (href === "/") return caminho === "/";
  return caminho === href || caminho.startsWith(`${href}/`);
}

/** Mensagens não leva selo: a tela é de modelo e não há regra do que contar. */
function contadorDoItem(href: string, contadores: Record<string, number>) {
  if (href === "/mensagens") return undefined;
  return contadores[href];
}

function ItemNav({ item, contador }: { item: ItemMenu; contador?: number }) {
  const caminho = usePathname() ?? "";
  const ligado = atual(caminho, item.href);
  const Icone = ICONES[item.href];
  return (
    <Link
      href={item.href}
      aria-current={ligado ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-controle px-3.5 text-sm leading-5 font-normal text-paper-ink-2 no-underline hover:bg-paper-subtle",
        ligado &&
          "bg-lateral-ativo font-medium text-lateral-tinta shadow-[inset_3px_0_0_var(--paper-secondary)]",
      )}
    >
      {Icone ? <Icone className="size-[18px] shrink-0" aria-hidden="true" /> : null}
      <span className="truncate">{item.rotulo}</span>
      {contador && contador > 0 ? (
        <span className="ml-auto inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-paper-tint-neutral px-1.5 text-xs font-medium text-paper-ink-2 tabular-nums">
          {contador > 99 ? "99+" : contador}
        </span>
      ) : null}
    </Link>
  );
}

export function MenuCasca({
  itens,
  grupos,
  contadores = {},
}: {
  itens?: ItemMenu[];
  grupos?: GrupoMenu[];
  contadores?: Record<string, number>;
}) {
  if (grupos && grupos.length > 0) {
    return (
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pt-4" aria-label="Áreas">
        {grupos.map((grupo) => (
          <section key={grupo.id} className="mb-3.5" aria-label={grupo.rotulo}>
            <p className="m-0 px-3 pb-1 font-mono text-[11px] leading-4 font-normal tracking-[0.06em] text-paper-ink-3 uppercase">
              {grupo.rotulo}
            </p>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              {grupo.itens.map((item) => (
                <li key={item.href}>
                  <ItemNav item={item} contador={contadorDoItem(item.href, contadores)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    );
  }

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto px-3" aria-label="Áreas">
      <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
        {(itens ?? []).map((item) => (
          <li key={item.href}>
            <ItemNav item={item} contador={contadorDoItem(item.href, contadores)} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
