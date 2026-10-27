import { describe, expect, it } from "vitest";
import { validarCancelamento } from "../../src/app/agendamentos/validar";

describe("validar cancelamento", () => {
  it("aceita o motivo com texto, já sem espaços nas pontas", () => {
    expect(validarCancelamento("  Paciente desmarcou  ")).toEqual({
      ok: true,
      valor: "Paciente desmarcou",
    });
  });

  it("recusa motivo vazio", () => {
    expect(validarCancelamento("")).toEqual({ ok: false, mensagem: "Informe o motivo" });
  });

  it("recusa motivo só com espaços", () => {
    expect(validarCancelamento("   ")).toEqual({ ok: false, mensagem: "Informe o motivo" });
  });
});
