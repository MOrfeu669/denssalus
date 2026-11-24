import { describe, expect, it } from "vitest";
import {
  consumoSemanal,
  mesAno,
  nivelBarra,
  situacaoQuantidade,
  tomValidade,
  venceDentro,
} from "../../src/app/estoque/situacao";

describe("situação do estoque na tela", () => {
  it("dado quantidade na metade do mínimo ou menos, quando classifica, então o nível é crítico; acima do mínimo é normal", () => {
    expect(situacaoQuantidade(2, 6)).toBe("critico");
    expect(situacaoQuantidade(8, 20)).toBe("baixo");
    expect(situacaoQuantidade(4, 6)).toBe("baixo");
    expect(situacaoQuantidade(8, 6)).toBe("normal");
  });

  it("dado a validade em 30 dias, quando pinta a data, então o tom é de perigo e o filtro de vencendo inclui o lote", () => {
    expect(venceDentro("2026-12-20", "2026-11-24", 30)).toBe(true);
    expect(venceDentro("2027-08-01", "2026-11-24", 30)).toBe(false);
    expect(tomValidade("2026-12-20", "2026-11-24")).toBe("perigo");
    expect(tomValidade(null, "2026-11-24")).toBe("ausente");
    expect(mesAno("2027-08-01")).toBe("08/2027");
    expect(mesAno(null)).toBe("—");
  });

  it("dado o mínimo, quando desenha a barra, então a marca fica no meio, que é o estoque mínimo", () => {
    expect(nivelBarra(2, 6)).toEqual({ preenchido: 2 / 12, marca: 0.5 });
    expect(nivelBarra(20, 0)).toEqual({ preenchido: 1, marca: null });
  });

  it("dado uma única baixa, quando calcula o consumo, então não inventa média semanal", () => {
    expect(consumoSemanal([{ tipo: "baixa", quantidade: 1, registradoEm: "2026-11-01T00:00:00.000Z" }])).toBeNull();
  });
});
