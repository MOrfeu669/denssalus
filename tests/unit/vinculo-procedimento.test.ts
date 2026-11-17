import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VinculoMateriais } from "../../src/app/procedimentos/materiais";
import { validarMateriais } from "../../src/app/procedimentos/validar";

const luva = { id: "m1", nome: "Luva" };
const resina = { id: "m2", nome: "Resina" };

describe("vínculo de material no procedimento", () => {
  it("dado o formulário, quando nenhum material está marcado, então não pede quantidade", () => {
    const html = renderToStaticMarkup(
      createElement(VinculoMateriais, {
        materiais: [luva, resina],
        listaInicialAberta: true,
        children: "Nome",
      }),
    );

    const nome = html.indexOf("Nome");
    const botao = html.indexOf("Vincular material");
    const caixa = html.indexOf("Luva");
    expect(nome).toBeGreaterThanOrEqual(0);
    expect(botao).toBeGreaterThan(nome);
    expect(caixa).toBeGreaterThan(botao);
    expect(html).toContain("Resina");
    expect(html).not.toContain("Quantidade por consulta");
    expect(html).not.toContain('name="materialId"');
  });

  it("dado o material marcado, quando a lista abre, então a quantidade aparece embaixo", () => {
    const html = renderToStaticMarkup(
      createElement(VinculoMateriais, {
        materiais: [luva, resina],
        listaInicialAberta: true,
        escolhaInicial: [resina.id],
        children: "Nome",
      }),
    );

    const caixa = html.indexOf("Luva");
    const quantidade = html.indexOf("Quantidade por consulta");
    expect(quantidade).toBeGreaterThan(caixa);
    expect(html).toContain('name="materialId" value="m2"');
    expect(html).toContain('name="quantidade-m2"');
    expect(html).not.toContain('name="quantidade-m1"');
    expect(html).not.toContain('value="m1"');
  });

  it("dado materiais marcados, quando a quantidade é inteira, então o vínculo é aceito", () => {
    const dados = new FormData();
    dados.append("materialId", "m2");
    dados.append("quantidade-m2", "2");
    expect(validarMateriais(dados)).toEqual({
      ok: true,
      valor: [{ materialId: "m2", quantidade: 2 }],
    });
    expect(validarMateriais(new FormData())).toEqual({ ok: true, valor: [] });
  });

  it("dado o material marcado, quando a quantidade está vazia ou zerada, então recusa", () => {
    for (const quantidade of ["", "0", "-1", "1.5"]) {
      const dados = new FormData();
      dados.append("materialId", "m2");
      dados.append("quantidade-m2", quantidade);
      expect(validarMateriais(dados)).toEqual({ ok: false, mensagem: "Informe a quantidade" });
    }
  });
});
