import { describe, expect, it } from "vitest";
import { intervaloDaHora, encaixarMinuto, intervaloEntreMinutos } from "../../src/app/agenda/slot";

describe("horário escolhido na grade", () => {
  it("a hora clicada vira o início e a hora seguinte vira o fim", () => {
    expect(intervaloDaHora("2026-11-10", 9)).toEqual({
      inicio: "2026-11-10T09:00",
      fim: "2026-11-10T10:00",
    });
  });

  it("a última hora do dia termina à meia-noite do dia seguinte", () => {
    expect(intervaloDaHora("2026-11-10", 23)).toEqual({
      inicio: "2026-11-10T23:00",
      fim: "2026-11-11T00:00",
    });
  });

  it("o arraste encaixa o início e o fim nos minutos do dia", () => {
    expect(encaixarMinuto(97)).toBe(90);
    expect(intervaloEntreMinutos("2026-11-12", 9 * 60, 10 * 60 + 30)).toEqual({
      inicio: "2026-11-12T09:00",
      fim: "2026-11-12T10:30",
    });
  });

  it("hora ou dia inválido não gera intervalo", () => {
    expect(intervaloDaHora("2026-11-10", 24)).toBeNull();
    expect(intervaloDaHora("10/11/2026", 9)).toBeNull();
  });
});
