import { describe, expect, it } from "vitest";
import { NOTA_ESTIMATIVA } from "../../src/app/procedimentos/texto";

describe("textos da tela Procedimentos", () => {
  it("quando a tela explica tempo e valor, então diz que são estimativas", () => {
    expect(NOTA_ESTIMATIVA).toBe("Tempo e valor são estimativas.");
  });
});
