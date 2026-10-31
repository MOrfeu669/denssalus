import { describe, expect, it } from "vitest";
import { MENSAGENS_NOTA_ENVIO } from "../../src/app/mensagens/texto";

describe("nota da tela Mensagens", () => {
  it("quando a tela explica o envio, então cita criação e os lembretes de 24 h e 5 h", () => {
    expect(MENSAGENS_NOTA_ENVIO).toContain("ao criar o agendamento");
    expect(MENSAGENS_NOTA_ENVIO).toContain("24 h e 5 h");
  });

  it("quando a tela explica o envio, então diz canal preferido e horário que ainda não passou", () => {
    expect(MENSAGENS_NOTA_ENVIO).toContain("canal preferido");
    expect(MENSAGENS_NOTA_ENVIO).toContain("só se o horário ainda não passou");
  });

  it("quando a tela explica o envio, então não promete mensagem ao cancelar nem ao marcar retorno", () => {
    expect(MENSAGENS_NOTA_ENVIO).not.toMatch(/cancel|retorno/i);
  });
});
