import { describe, expect, it } from "vitest";
import { filtrarUsuarios } from "../../src/app/usuarios/filtrar";
import type { Usuario } from "../../src/domain/auth/tipos";

function usuario(parcial: Partial<Usuario> & Pick<Usuario, "id" | "nome" | "papel">): Usuario {
  return {
    email: `${parcial.id}@ex.com`,
    clinicaId: "c1",
    ativo: true,
    ...parcial,
  };
}

const lista: Usuario[] = [
  usuario({ id: "1", nome: "Ana Admin", papel: "admin" }),
  usuario({ id: "2", nome: "Bruno Dentista", papel: "dentista" }),
  usuario({ id: "3", nome: "Carla Recepcionista", papel: "recepcionista" }),
  usuario({ id: "4", nome: "Diego Dentista", papel: "dentista", email: "diego@ex.com" }),
];

describe("filtrar usuários na tela", () => {
  it("dado busca por nome, quando filtra, então mantém só quem casa", () => {
    expect(filtrarUsuarios(lista, "bruno", ["admin", "dentista", "recepcionista"]).map((u) => u.id)).toEqual([
      "2",
    ]);
  });

  it("dado só papel dentista marcado, quando filtra, então esconde admin e recepcionista", () => {
    expect(filtrarUsuarios(lista, "", ["dentista"]).map((u) => u.id)).toEqual(["2", "4"]);
  });

  it("dado nenhum papel marcado, quando filtra, então mostra todos os papéis", () => {
    expect(filtrarUsuarios(lista, "", []).map((u) => u.id)).toEqual(["1", "2", "3", "4"]);
  });
});
