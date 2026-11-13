import { describe, expect, it } from "vitest";
import {
  CENTRO,
  dataNoMes,
  deslocarDia,
  distanciaVisual,
  faixa,
  nomeMes,
  papelDaDistancia,
  passosDoArraste,
  rotuloDia,
} from "../../src/app/agenda/faixa-data";

describe("faixa de datas da agenda", () => {
  it("centra o dia e deixa duas datas apagadas de cada lado das três amostras", () => {
    const dias = faixa("2026-11-13", deslocarDia);
    expect(dias).toHaveLength(7);
    expect(dias[CENTRO]).toBe("2026-11-13");
    expect(papelDaDistancia(0)).toBe("amostra");
    expect(papelDaDistancia(1)).toBe("amostra");
    expect(papelDaDistancia(2)).toBe("lado");
    expect(papelDaDistancia(3)).toBe("lado");
    expect(papelDaDistancia(4)).toBe("fora");
    expect(rotuloDia("2026-11-13")).toEqual({ semana: "sex", numero: "13" });
  });

  it("centra o mês e nomeia o mês da data", () => {
    const meses = faixa("2026-11-13", dataNoMes);
    expect(meses[CENTRO]).toBe("2026-11-13");
    expect(nomeMes(meses[CENTRO])).toBe("novembro");
    expect(nomeMes(meses[CENTRO - 1])).toBe("outubro");
    expect(nomeMes(meses[CENTRO + 1])).toBe("dezembro");
  });

  it("ao arrastar um passo para a esquerda, escolhe o dia seguinte", () => {
    expect(passosDoArraste(-56, 56)).toBe(1);
    expect(deslocarDia("2026-11-13", 1)).toBe("2026-11-14");
  });

  it("ao soltar sem movimento, a distância visual continua no centro", () => {
    expect(distanciaVisual(CENTRO, CENTRO, 0, 56)).toBe(0);
    expect(passosDoArraste(4, 56)).toBe(0);
  });

  it("ao escolher fevereiro a partir do dia 31, fica no último dia do mês", () => {
    expect(dataNoMes("2026-01-31", 1)).toBe("2026-02-28");
  });
});
