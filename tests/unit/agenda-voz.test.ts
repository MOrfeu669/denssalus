// @vitest-environment happy-dom

import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { gruposDaCasca } from "../../src/app/casca-menu";
import { CabecalhoCasca } from "../../src/app/casca-cabecalho";
import { MenuCasca } from "../../src/app/menu-casca";
import type { Papel } from "../../src/domain/auth/tipos";

vi.mock("next/navigation", () => ({
  usePathname: () => "/agenda",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const PAPEIS: Papel[] = ["admin", "dentista", "recepcionista"];

describe("assistente de voz na tela da agenda", () => {
  it("dado a agenda aberta, quando a casca envolve a rota, então o botão fixo, o microfone e /voz continuam", () => {
    expect(existsSync("src/app/agenda/layout.tsx")).toBe(false);
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    const botao = readFileSync("src/app/voz/botao-voz.tsx", "utf8");
    const lateral = readFileSync("src/app/casca-lateral.tsx", "utf8");
    const cabecalho = readFileSync("src/app/casca-cabecalho.tsx", "utf8");
    expect(layout).toContain("<Casca");
    expect(layout).toContain("<BotaoVoz");
    expect(botao).toContain("data-voz-flutuante");
    expect(lateral).toContain("{clinicaNome}");
    expect(lateral).not.toContain("<select");
    expect(lateral).not.toContain("ChevronDown");
    expect(cabecalho).not.toContain("Ajuda");
    expect(cabecalho).not.toContain("CircleHelp");

    const cabeca = renderToStaticMarkup(createElement(CabecalhoCasca, {}));
    expect(cabeca).toContain('aria-label="Assistente de voz"');
    expect(cabeca).not.toContain("Ajuda");

    for (const papel of PAPEIS) {
      const html = renderToStaticMarkup(
        createElement(MenuCasca, {
          grupos: gruposDaCasca(papel),
          contadores: { "/mensagens": 3, "/retornos": 6 },
        }),
      );
      expect(html).toContain('href="/voz"');
      expect(html).toContain("Assistente de voz");
      expect(html).not.toMatch(/Mensagens[\s\S]{0,80}>3</);
      if (papel === "admin") expect(html).toContain(">6<");
    }
  });
});
