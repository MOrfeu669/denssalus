import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Procedimento } from "../../src/domain/procedimento/tipos";
import type { MaterialTela } from "../../src/app/estoque/form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined }),
}));

vi.mock("../../src/app/procedimentos/actions", () => ({
  cadastrar: vi.fn(),
  editar: vi.fn(),
  excluir: vi.fn(),
}));

vi.mock("../../src/app/estoque/actions", () => ({
  cadastrarMaterial: vi.fn(),
  reabastecerMaterial: vi.fn(),
}));

import { Estoque } from "../../src/app/estoque/form";
import { Procedimentos } from "../../src/app/procedimentos/form";

const limpeza: Procedimento = {
  id: "p1",
  clinicaId: "c1",
  nome: "Limpeza",
  tempoMedioMinutos: 30,
  valorMedio: 120,
};

const luva: MaterialTela = {
  id: "m1",
  nome: "Luva",
  quantidade: 10,
  quantidadeMinima: 2,
  historico: [],
};

describe("cadastro de procedimento na tela", () => {
  it("dado a lista, quando a tela abre, então o formulário fica atrás do botão", () => {
    const html = renderToStaticMarkup(
      createElement(Procedimentos, { procedimentos: [limpeza], podeExcluir: false, materiais: [] }),
    );

    expect(html).toContain("Novo procedimento");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain("Criar procedimento");
    expect(html).not.toContain("Vincular material");
    expect(html).toContain("Limpeza");
    expect(html).toContain("Procedimentos da clínica");
  });

  it("dado o diálogo de novo procedimento, quando ele abre, então o vínculo fica no formulário", () => {
    const html = renderToStaticMarkup(
      createElement(Procedimentos, {
        procedimentos: [limpeza],
        podeExcluir: false,
        materiais: [{ id: "m1", nome: "Luva" }],
        cadastroAberto: true,
      }),
    );

    expect(html).toContain('id="procedimentos-cadastro"');
    expect(html).toContain("Criar procedimento");
    expect(html).toContain("Vincular material");
    expect(html).not.toContain("Luva");
    expect(html).not.toContain("Quantidade por consulta");
  });
});

describe("cadastro de material na tela", () => {
  it("dado a lista, quando a tela abre, então o formulário fica atrás do botão", () => {
    const html = renderToStaticMarkup(
      createElement(Estoque, { materiais: [luva] }),
    );

    expect(html).toContain("Novo material");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain("Cadastrar material");
    expect(html).not.toContain('name="quantidadeMinima"');
    expect(html).toContain("Luva");
    expect(html).toContain("Materiais da clínica");
    expect(html).not.toContain("Material de cada procedimento");
  });
});
