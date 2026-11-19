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

    const indiceLogo = html.indexOf("<img");
    const indiceTitulo = html.indexOf("<h1");

    expect(indiceLogo).toBeGreaterThanOrEqual(0);
    expect(indiceTitulo).toBeGreaterThan(indiceLogo);
    expect(html.slice(indiceTitulo, indiceTitulo + 200)).toContain("Entrar");
  });

  it("quando o formulário de entrar abre, então o aviso final aparece depois do botão de entrar", () => {
    const html = renderToStaticMarkup(createElement(FormLogin));

    const indiceBotao = html.indexOf("Entrar</button>");
    const indiceEscudo = html.indexOf('viewBox="0 0 16 20"');
    const indiceAviso = html.indexOf("Você continuará conectado até sair.");

    expect(indiceBotao).toBeGreaterThanOrEqual(0);
    expect(indiceEscudo).toBeGreaterThan(indiceBotao);
    expect(indiceAviso).toBeGreaterThan(indiceEscudo);
  });
});
