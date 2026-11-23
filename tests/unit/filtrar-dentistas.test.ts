import { describe, expect, it } from "vitest";
import { filtrarDentistas } from "../../src/app/dentistas/filtrar";
import type { Dentista } from "../../src/domain/dentista/tipos";

const lista: Dentista[] = [
  {
    id: "d1",
    usuarioId: "u1",
    clinicaId: "c1",
    nome: "Camila Torres",
    cro: "12345",
    telefone: "11999999999",
    cpf: "12345678901",
    especialidades: ["Ortodontia"],
    ativo: true,
  },
  {
    id: "d2",
    usuarioId: "u2",
    clinicaId: "c1",
    nome: "Rui Costa",
    cro: "67890",
    telefone: "11888888888",
    cpf: "10987654321",
    especialidades: [],
    ativo: true,
  },
];

describe("filtrar dentistas na tela", () => {
  it("dado busca por nome, quando filtra, então mantém só quem casa", () => {
    expect(filtrarDentistas(lista, "cami").map((d) => d.id)).toEqual(["d1"]);
  });

  it("dado busca vazia, quando filtra, então devolve a lista inteira", () => {
    expect(filtrarDentistas(lista, "  ").map((d) => d.id)).toEqual(["d1", "d2"]);
  });
});
