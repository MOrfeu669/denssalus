// @vitest-environment happy-dom

import { createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
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

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

afterEach(async () => {
  for (const root of roots.splice(0)) {
    await act(async () => {
      root.unmount();
    });
  }
  document.body.innerHTML = "";
});

async function montar(node: ReactNode) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => {
    root.render(node);
  });
}

function dialogoVisivel(): HTMLElement | null {
  const dialog = document.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]');
  if (!dialog || dialog.hasAttribute("hidden")) return null;
  if (!dialog.hasAttribute("data-open") && dialog.hasAttribute("data-closed")) return null;
  return dialog;
}

async function esperar(condicao: () => boolean) {
  const inicio = Date.now();
  while (Date.now() - inicio < 1200) {
    if (condicao()) return;
    await act(async () => {
      await new Promise((resolver) => setTimeout(resolver, 16));
    });
  }
}

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

  it("dado o diálogo de novo procedimento, quando ele abre, então o vínculo fica no formulário", async () => {
    await montar(
      createElement(Procedimentos, {
        procedimentos: [limpeza],
        podeExcluir: false,
        materiais: [{ id: "m1", nome: "Luva" }],
        cadastroAberto: true,
      }),
    );
    await esperar(() => dialogoVisivel() !== null);

    const dialog = dialogoVisivel();
    expect(dialog).toBeTruthy();
    expect(dialog?.textContent).toContain("Novo procedimento");
    expect(dialog?.textContent).toContain("Criar procedimento");
    expect(dialog?.textContent).toContain("Vincular material");
    expect(dialog?.querySelector('[name="nome"]')).toBeTruthy();
    expect(dialog?.querySelector('[name="tempoMedioMinutos"]')).toBeTruthy();
    expect(dialog?.querySelector('[name="valorMedio"]')).toBeTruthy();
    expect(dialog?.textContent).not.toContain("Luva");
    expect(dialog?.textContent).not.toContain("Quantidade por consulta");
    expect(document.body.textContent).not.toContain("Quantidade por consulta");
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
