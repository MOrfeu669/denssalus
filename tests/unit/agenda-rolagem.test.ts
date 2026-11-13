import { describe, expect, it } from "vitest";
import { scrollDoArraste } from "../../src/app/agenda/grade";

describe("rolagem horizontal da agenda", () => {
  it("ao arrastar o ponteiro para a esquerda, a grade anda para a direita", () => {
    expect(scrollDoArraste(40, 100, 70)).toBe(70);
  });

  it("ao arrastar o ponteiro para a direita, a grade volta", () => {
    expect(scrollDoArraste(80, 100, 130)).toBe(50);
  });
});
