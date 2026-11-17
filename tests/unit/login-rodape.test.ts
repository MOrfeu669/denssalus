import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Rodape } from "../../src/app/login/rodape";

describe("rodapé da tela Entrar", () => {
  it("quando a tela de entrar abre, então mostra o copyright e o nome do sistema", () => {
    const html = renderToStaticMarkup(createElement(Rodape));

    expect(html).toContain("© 2026 denssalus");
    expect(html).toContain("Sistema de agendamento odontológico");
  });

  it("dado um celular estreito, então o separador some e as duas frases empilham, sem quebrar no meio", () => {
    const html = renderToStaticMarkup(createElement(Rodape));

    expect(html).toContain("max-[960px]:flex-col");
    expect(html).toContain("max-[960px]:hidden");
  });
});
