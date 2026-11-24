// @vitest-environment happy-dom

import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { gruposDaCasca } from "../../src/app/casca-menu";
import { CabecalhoCasca } from "../../src/app/casca-cabecalho";
import { MenuCasca } from "../../src/app/menu-casca";
import { AtalhoVoz } from "../../src/app/voz/atalho";

vi.mock("next/navigation", () => ({
  usePathname: () => "/agenda",
  useRouter: () => ({ push: vi.fn() }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

afterEach(async () => {
  for (const root of roots.splice(0)) {
    await act(async () => {
      root.unmount();
    });
  }
  document.body.innerHTML = "";
});

describe("assistente de voz na casca", () => {
  it("dado cada papel, quando a lateral abre, então o link da rota de voz fica no grupo Gestão", () => {
    for (const papel of ["admin", "dentista", "recepcionista"] as const) {
      const grupos = gruposDaCasca(papel);
      const gestao = grupos.find((grupo) => grupo.id === "gestao");
      expect(gestao?.itens).toContainEqual({ href: "/voz", rotulo: "Assistente de voz" });

      const html = renderToStaticMarkup(createElement(MenuCasca, { grupos }));
      expect(html).toContain('href="/voz"');
      expect(html).toContain("Assistente de voz");
      expect(html).toContain("Gestão");
    }
  });

  it("dado o cabeçalho, quando renderiza, então o atalho do assistente aparece antes das notificações", () => {
    const html = renderToStaticMarkup(
      createElement(CabecalhoCasca, {
        busca: createElement("div", null, "busca"),
        sino: createElement("button", { type: "button", "aria-label": "Notificações" }, "sino"),
      }),
    );

    expect(html).toContain('aria-label="Assistente de voz"');
    expect(html.indexOf("Assistente de voz")).toBeLessThan(html.indexOf("Notificações"));
  });

  it("dado o botão fixo da integração, quando o atalho do cabeçalho é acionado, então o clique vai para esse botão", async () => {
    const clique = vi.fn();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);
    await act(async () => {
      root.render(
        createElement(
          "div",
          null,
          createElement("button", { type: "button", "data-voz-flutuante": "", onClick: clique }, "Assistente de voz"),
          createElement(AtalhoVoz),
        ),
      );
    });

    const atalho = document.querySelector<HTMLButtonElement>('button[aria-label="Assistente de voz"]');
    await act(async () => {
      atalho?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(clique).toHaveBeenCalledOnce();
  });
});
