import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BadgeStatus } from "../../src/components/ui/badge";

describe("badge de status do agendamento", () => {
  it("dado cada status, quando o badge renderiza, então usa o token e o cancelado sai riscado", () => {
    const agendado = renderToStaticMarkup(createElement(BadgeStatus, { status: "agendado" }));
    expect(agendado).toContain("bg-paper-status-agendado-fundo");
    expect(agendado).toContain("text-paper-status-agendado-tinta");
    expect(agendado).toContain(">agendado<");

    const espera = renderToStaticMarkup(createElement(BadgeStatus, { status: "em_espera" }));
    expect(espera).toContain("bg-paper-status-em-espera-fundo");
    expect(espera).toContain(">em espera<");

    const iniciado = renderToStaticMarkup(createElement(BadgeStatus, { status: "iniciado" }));
    expect(iniciado).toContain("bg-paper-status-iniciado-fundo");
    expect(iniciado).toContain(">iniciado<");

    const concluido = renderToStaticMarkup(createElement(BadgeStatus, { status: "concluido" }));
    expect(concluido).toContain("bg-paper-status-concluido-fundo");
    expect(concluido).toContain(">concluído<");

    const cancelado = renderToStaticMarkup(createElement(BadgeStatus, { status: "cancelado" }));
    expect(cancelado).toContain("line-through");
    expect(cancelado).toContain("text-paper-status-cancelado-tinta");
    expect(cancelado).toContain(">cancelado<");
  });
});
