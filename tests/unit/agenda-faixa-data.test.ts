import { describe, expect, it } from "vitest";
import {
  CENTRO,
  dataNoAno,
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

  it("centra o ano e deixa o anterior e o seguinte ao lado", () => {
    const anos = faixa("2026-11-16", dataNoAno);
    expect(anos[CENTRO].slice(0, 4)).toBe("2026");
    expect(anos[CENTRO - 1].slice(0, 4)).toBe("2025");
    expect(anos[CENTRO + 1].slice(0, 4)).toBe("2027");
  });

  it("ao escolher o ano seguinte a partir de 29 de fevereiro, fica em 28 de fevereiro", () => {
    expect(dataNoAno("2024-02-29", 1)).toBe("2025-02-28");
    expect(dataNoAno("2026-11-13", 1)).toBe("2027-11-13");
  });

  it("ao escolher fevereiro a partir do dia 31, fica no último dia do mês", () => {
    expect(dataNoMes("2026-01-31", 1)).toBe("2026-02-28");
  });
});
