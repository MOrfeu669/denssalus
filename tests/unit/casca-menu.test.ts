import { describe, expect, it } from "vitest";
import { itensMenu, menuDaCasca, rotuloPapel } from "../../src/app/casca-menu";

describe("menu da casca (etapa 1)", () => {
  it("Dado o papel, Quando pede o rótulo, Então devolve o nome em português", () => {
    expect(rotuloPapel("admin")).toBe("Admin");
    expect(rotuloPapel("dentista")).toBe("Dentista");
    expect(rotuloPapel("recepcionista")).toBe("Recepcionista");
  });

  it("Dado o Admin, Então o menu tem as sete áreas na ordem", () => {
    expect(itensMenu("admin")).toEqual([
      { href: "/usuarios", rotulo: "Usuários" },
      { href: "/clinica", rotulo: "Clínica" },
      { href: "/dentistas", rotulo: "Dentistas" },
      { href: "/procedimentos", rotulo: "Procedimentos" },
      { href: "/pacientes", rotulo: "Pacientes" },
      { href: "/agendamentos", rotulo: "Agendamentos" },
      { href: "/agenda", rotulo: "Agenda" },
    ]);
  });

  it("Dado o Dentista, Então não vê Usuários, Clínica nem Dentistas", () => {
    expect(itensMenu("dentista").map((item) => item.rotulo)).toEqual([
      "Procedimentos",
      "Pacientes",
      "Agendamentos",
      "Agenda",
    ]);
  });

  it("Dado a Recepcionista, Então não vê Procedimentos", () => {
    expect(itensMenu("recepcionista").map((item) => item.rotulo)).toEqual([
      "Pacientes",
      "Agendamentos",
      "Agenda",
    ]);
  });

  it("Dado qualquer papel, Então o menu não traz área da etapa 2", () => {
    const proibidos = ["/mensagens", "/retornos", "/estoque", "/dashboard", "/prontuario"];
    for (const papel of ["admin", "dentista", "recepcionista"] as const) {
      const hrefs = itensMenu(papel).map((item) => item.href);
      for (const href of proibidos) expect(hrefs).not.toContain(href);
    }
  });

  it("Dado o menu devolvido, Quando é alterado, Então a lista original não muda", () => {
    itensMenu("admin").pop();
    expect(itensMenu("admin")).toHaveLength(7);
  });
});

describe("menu da casca (etapa 2)", () => {
  it("Dado o Admin, Então o menu ganha Retornos, Estoque, Dashboard e Mensagens", () => {
    expect(menuDaCasca("admin").map((item) => item.rotulo)).toEqual([
      "Usuários",
      "Clínica",
      "Dentistas",
      "Procedimentos",
      "Pacientes",
      "Agendamentos",
      "Agenda",
      "Retornos",
      "Estoque",
      "Dashboard",
      "Mensagens",
    ]);
  });

  it("Dado Dentista ou Recepcionista, Então Mensagens não aparece", () => {
    expect(menuDaCasca("dentista").map((item) => item.href)).not.toContain("/mensagens");
    expect(menuDaCasca("recepcionista").map((item) => item.rotulo)).toEqual([
      "Pacientes",
      "Agendamentos",
      "Agenda",
      "Retornos",
      "Estoque",
      "Dashboard",
    ]);
  });
});
