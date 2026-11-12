import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/pacientes",
}));

vi.mock("../../src/app/auth/actions", () => ({
  entrar: vi.fn(),
}));

import { FormLogin } from "../../src/app/login/form";
import { MenuCasca } from "../../src/app/menu-casca";

describe("casca e login com Tailwind", () => {
  it("dado o caminho Pacientes, quando o menu abre, então o item atual usa a cor de ação", () => {
    const html = renderToStaticMarkup(
      createElement(MenuCasca, {
        itens: [
          { href: "/pacientes", rotulo: "Pacientes" },
          { href: "/agenda", rotulo: "Agenda" },
        ],
      }),
    );

    expect(html).toContain('aria-current="page"');
    expect(html).toContain("bg-acao");
    expect(html).toContain("Pacientes");
  });

  it("quando a tela de entrar abre, então o botão usa a cor de ação", () => {
    const html = renderToStaticMarkup(createElement(FormLogin));

    expect(html).toContain("Entrar");
    expect(html).toContain("bg-acao");
    expect(html).toContain('type="submit"');
  });
});
