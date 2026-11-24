// @vitest-environment happy-dom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-dom", async () => {
  const atual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return {
    ...atual,
    useFormStatus: () => ({ pending: true, data: null, method: null, action: null }),
  };
});

import { BotaoEnviar } from "../../src/components/ui/botao-enviar";

describe("botão de envio", () => {
  it("dado o formulário enviando, quando o botão renderiza, então mostra Salvando e fica inativo", () => {
    const html = renderToStaticMarkup(createElement(BotaoEnviar, { rotulo: "Salvar paciente" }));
    expect(html).toContain("Salvando…");
    expect(html).toContain("disabled");
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("Salvar paciente");
  });
});
