import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/app/auth/actions", () => ({
  entrar: vi.fn(),
}));

import { FormLogin } from "../../src/app/login/form";
import { Marca } from "../../src/app/login/marca";

describe("marca e formulário da tela Entrar com a logo da denssalus", () => {
  it("quando a lateral de marca abre, então mostra a logo com o texto alternativo da denssalus", () => {
    const html = renderToStaticMarkup(createElement(Marca));

    expect(html).toContain(
      'alt="Logo da denssalus: dente estilizado com ícone de agenda e onda sonora"',
    );
  });

  it("quando o formulário de entrar abre, então o cabeçalho mostra a logo acima do título", () => {
    const html = renderToStaticMarkup(createElement(FormLogin));

    expect(html).toContain("rounded-[12.32px] border border-linha bg-white");
    expect(html).toContain("Entrar");
  });

  it("quando o formulário de entrar abre, então o aviso final tem a borda que o liga ao botão", () => {
    const html = renderToStaticMarkup(createElement(FormLogin));

    expect(html).toContain("border-t border-linha pt-5");
    expect(html).toContain("Você continuará conectado até sair.");
  });
});
