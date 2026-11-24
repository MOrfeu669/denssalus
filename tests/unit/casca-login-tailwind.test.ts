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
  it("dado o caminho Pacientes, quando o menu abre, então o item atual usa o fundo claro da lateral", () => {
    const html = renderToStaticMarkup(
      createElement(MenuCasca, {
        itens: [
          { href: "/pacientes", rotulo: "Pacientes" },
          { href: "/agenda", rotulo: "Agenda" },
        ],
      }),
    );

    expect(html).toContain('aria-current="page"');
    expect(html).toContain("bg-lateral-ativo");
    expect(html).toContain("text-lateral-tinta");
    expect(html).toContain("shadow-[inset_3px_0_0_var(--paper-secondary)]");
    expect(html).not.toContain("bg-sidebar-accent");
    expect(html).not.toContain("text-white");
    expect(html).toContain("Pacientes");
  });

  it("quando a tela de entrar abre, então o botão usa a cor de ação", () => {
    const html = renderToStaticMarkup(createElement(FormLogin));

    expect(html).toContain("Entrar");
    expect(html).toContain("bg-(--cor-login-acao)");
    expect(html).toContain("hover:bg-(--cor-login-marca)");
    expect(html).toContain('type="submit"');
  });
});
