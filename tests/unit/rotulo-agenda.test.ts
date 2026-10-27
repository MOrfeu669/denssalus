import { describe, expect, it } from "vitest";
import { rotuloStatus } from "../../src/app/agenda/rotulo";

describe("rotuloStatus", () => {
  it("mostra agendado como agendado", () => {
    expect(rotuloStatus("agendado")).toBe("agendado");
  });

  it("mostra em_espera como em espera", () => {
    expect(rotuloStatus("em_espera")).toBe("em espera");
  });

  it("mostra iniciado como iniciado", () => {
    expect(rotuloStatus("iniciado")).toBe("iniciado");
  });

  it("mostra concluido como concluído", () => {
    expect(rotuloStatus("concluido")).toBe("concluído");
  });

  it("mostra cancelado como cancelado", () => {
    expect(rotuloStatus("cancelado")).toBe("cancelado");
  });
});
