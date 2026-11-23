import { describe, expect, it } from "vitest";
import {
  filtrarProcedimentos,
  paginaDe,
  PROCEDIMENTOS_POR_PAGINA,
} from "../../src/app/procedimentos/filtrar";
import type { Procedimento } from "../../src/domain/procedimento/tipos";

function proc(id: string, nome: string): Procedimento {
  return {
    id,
    clinicaId: "c1",
    nome,
    tempoMedioMinutos: 30,
    valorMedio: 100,
  };
}

describe("filtrar e paginar procedimentos na tela", () => {
  it("dado busca por nome, quando filtra, então mantém só quem casa", () => {
    const lista = [proc("1", "Limpeza"), proc("2", "Canal"), proc("3", "Clareamento")];
    expect(filtrarProcedimentos(lista, "cla").map((p) => p.id)).toEqual(["3"]);
  });

  it("dado mais de 15 itens, quando pede a primeira página, então devolve 15 e sinaliza mais", () => {
    const lista = Array.from({ length: 20 }, (_, i) => proc(String(i), `Proc ${i}`));
    const pagina = paginaDe(lista, 1);
    expect(pagina.itens).toHaveLength(PROCEDIMENTOS_POR_PAGINA);
    expect(pagina.temMais).toBe(true);
    expect(pagina.total).toBe(20);
  });

  it("dado 20 itens, quando pede a segunda página, então devolve os 20", () => {
    const lista = Array.from({ length: 20 }, (_, i) => proc(String(i), `Proc ${i}`));
    const pagina = paginaDe(lista, 2);
    expect(pagina.itens).toHaveLength(20);
    expect(pagina.temMais).toBe(false);
  });
});
