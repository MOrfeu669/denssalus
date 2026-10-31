import { describe, expect, it } from "vitest";
import { itensEtapa2, itensMenu, menuDaCasca } from "../../src/app/casca-menu";

describe("menu da casca (etapa 2)", () => {
  it("Dado qualquer papel, Então entram Retornos, Estoque e Dashboard depois da etapa 1", () => {
    for (const papel of ["admin", "dentista", "recepcionista"] as const) {
      const rotulos = menuDaCasca(papel).map((item) => item.rotulo);
      const base = itensMenu(papel).map((item) => item.rotulo);
      expect(rotulos.slice(0, base.length)).toEqual(base);
      expect(rotulos).toEqual([...base, "Retornos", "Estoque", "Dashboard", ...(papel === "admin" ? ["Mensagens"] : [])]);
    }
  });

  it("Dado Dentista ou Recepcionista, Então Mensagens não aparece", () => {
    for (const papel of ["dentista", "recepcionista"] as const) {
      expect(itensEtapa2(papel).map((item) => item.href)).not.toContain("/mensagens");
      expect(menuDaCasca(papel).map((item) => item.href)).not.toContain("/mensagens");
    }
  });

  it("Dado o Admin, Então Mensagens fica só no acréscimo da etapa 2", () => {
    expect(itensMenu("admin").map((item) => item.href)).not.toContain("/mensagens");
    expect(itensEtapa2("admin").map((item) => item.rotulo)).toEqual([
      "Retornos",
      "Estoque",
      "Dashboard",
      "Mensagens",
    ]);
  });
});
