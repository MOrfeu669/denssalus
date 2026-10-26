import { describe, expect, it } from "vitest";
import { validarProcedimento } from "../../src/app/procedimentos/validar";

const base = { nome: " Restauração ", tempoMedioMinutos: "40", valorMedio: "150" };

describe("validar procedimento", () => {
  it("aceita nome com espaço, tempo 40 e valor 150", () => {
    expect(validarProcedimento(base)).toEqual({
      ok: true,
      valor: { nome: "Restauração", tempoMedioMinutos: 40, valorMedio: 150 },
    });
    expect(validarProcedimento({ ...base, tempoMedioMinutos: " 40 " }).ok).toBe(true);
  });

  it("aceita valor com vírgula decimal como número com ponto", () => {
    expect(validarProcedimento({ ...base, valorMedio: "150,50" })).toMatchObject({
      ok: true,
      valor: { valorMedio: 150.5 },
    });
    for (const valorMedio of ["150.00", "150.5", "0"]) {
      expect(validarProcedimento({ ...base, valorMedio }).ok).toBe(true);
    }
    expect(validarProcedimento({ ...base, valorMedio: "150.5" })).toMatchObject({
      valor: { valorMedio: 150.5 },
    });
  });

  it("recusa nome em branco", () => {
    expect(validarProcedimento({ ...base, nome: "  " })).toEqual({
      ok: false,
      mensagem: "Informe o nome",
    });
  });

  it("recusa tempo vazio, zero, negativo, fracionário e texto", () => {
    const mensagem = "Informe o tempo médio";
    for (const tempoMedioMinutos of ["", "  ", "0", "-1", "40.5", "40,5", "abc"]) {
      expect(validarProcedimento({ ...base, tempoMedioMinutos })).toEqual({ ok: false, mensagem });
    }
  });

  it("recusa valor vazio, negativo, com três casas e texto", () => {
    const mensagem = "Informe o valor médio";
    for (const valorMedio of ["", "  ", "-1", "150.555", "150,555", "abc"]) {
      expect(validarProcedimento({ ...base, valorMedio })).toEqual({ ok: false, mensagem });
    }
  });
});
