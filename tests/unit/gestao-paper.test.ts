// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined, push: () => undefined }),
}));

vi.mock("../../src/app/estoque/actions", () => ({
  cadastrarMaterial: vi.fn(() => new Promise(() => undefined)),
  reabastecerMaterial: vi.fn(),
}));

vi.mock("../../src/app/dashboard/actions", () => ({
  salvarCamposDoPapel: vi.fn(),
  salvarPreferencia: vi.fn(),
  exportarResumo: vi.fn(),
}));

import { CamposDoPapel } from "../../src/app/dashboard/campos-papel";
import { Estoque, type MaterialTela } from "../../src/app/estoque/form";
import { ConfirmacaoVoz } from "../../src/app/voz/botao-voz";

const luva: MaterialTela = {
  id: "m1",
  nome: "Luva",
  quantidade: 10,
  quantidadeMinima: 2,
  historico: [],
};

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
  return host;
}

function dialogoVisivel(papel: "dialog" | "alertdialog" = "dialog"): HTMLElement | null {
  const dialog = document.querySelector<HTMLElement>(`[role="${papel}"]`);
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

function preencherCadastro(dialog: HTMLElement) {
  const campos: Record<string, string> = {
    nome: "Luva",
    quantidade: "10",
    quantidadeMinima: "2",
    validade: "2026-12-01",
  };
  for (const [nome, valor] of Object.entries(campos)) {
    const campo = dialog.querySelector<HTMLInputElement>(`[name="${nome}"]`);
    if (!campo) throw new Error(`campo ${nome} ausente`);
    campo.value = valor;
  }
}

describe("diálogo de novo material", () => {
  it("dado o botão Novo material, quando o diálogo abre, então o foco entra no nome e o formulário conserva os names", async () => {
    await montar(createElement(Estoque, { materiais: [luva] }));
    const gatilho = [...document.querySelectorAll("button")].find((botao) => botao.textContent?.includes("Cadastrar material"));
    expect(gatilho?.getAttribute("aria-haspopup")).toBe("dialog");
    expect(gatilho?.getAttribute("aria-expanded")).toBe("false");
    expect(dialogoVisivel()).toBeNull();

    await act(async () => {
      gatilho?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    await esperar(() => dialogoVisivel() !== null);

    const dialog = dialogoVisivel();
    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    const rotulo = dialog?.getAttribute("aria-labelledby");
    expect(document.getElementById(rotulo ?? "")?.textContent).toBe("Cadastrar material");
    expect(dialog?.contains(document.activeElement)).toBe(true);
    expect((document.activeElement as HTMLInputElement).name).toBe("nome");
    for (const nome of ["nome", "quantidade", "quantidadeMinima", "validade"]) {
      expect(dialog?.querySelector(`[name="${nome}"]`)).toBeTruthy();
    }
    expect(dialog?.querySelector('button[type="submit"]')?.textContent).toContain("Cadastrar material");
  });

  it("dado o diálogo aberto, quando Esc é pressionado, então ele fecha e o foco volta ao gatilho", async () => {
    await montar(createElement(Estoque, { materiais: [luva] }));
    const gatilho = [...document.querySelectorAll("button")].find((botao) => botao.textContent?.includes("Cadastrar material"));
    await act(async () => {
      gatilho?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    await esperar(() => dialogoVisivel() !== null);

    await act(async () => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }),
      );
    });
    await esperar(() => dialogoVisivel() === null);

    expect(dialogoVisivel()).toBeNull();
    expect(document.activeElement).toBe(gatilho);
  });

  it("dado o cadastro pendente, quando Esc é pressionado, então o diálogo permanece aberto", async () => {
    await montar(createElement(Estoque, { materiais: [luva] }));
    const gatilho = [...document.querySelectorAll("button")].find((botao) => botao.textContent?.includes("Cadastrar material"));
    await act(async () => {
      gatilho?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    await esperar(() => dialogoVisivel() !== null);
    const dialog = dialogoVisivel();
    expect(dialog).toBeTruthy();
    preencherCadastro(dialog as HTMLElement);
    const form = dialog?.querySelector("form");
    // happy-dom recusa o submitter do Button no FormData do React 19.
    const Formulario = globalThis.FormData;
    globalThis.FormData = class extends Formulario {
      constructor(alvo?: HTMLFormElement, _submitter?: HTMLElement) {
        super(alvo);
      }
    } as typeof FormData;
    try {
      await act(async () => {
        form?.requestSubmit();
      });
    } finally {
      globalThis.FormData = Formulario;
    }
    await esperar(() => dialog?.querySelector('button[type="submit"]')?.textContent?.includes("Salvando") === true);

    await act(async () => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }),
      );
    });
    await esperar(() => dialogoVisivel() !== null);

    expect(dialogoVisivel()).toBeTruthy();
    expect(dialogoVisivel()?.querySelector('button[type="submit"]')?.hasAttribute("disabled")).toBe(true);
  });
});

describe("confirmação de voz", () => {
  it("dado a operação pendente, quando o diálogo abre, então o foco está em Confirmar e Esc cancela", async () => {
    const onConfirmar = vi.fn();
    const onCancelar = vi.fn();
    await montar(
      createElement(ConfirmacaoVoz, {
        resumo: "Cadastrar luva",
        onConfirmar,
        onCancelar,
      }),
    );
    await esperar(() => dialogoVisivel("alertdialog") !== null);

    const dialog = dialogoVisivel("alertdialog");
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    const rotulo = dialog?.getAttribute("aria-labelledby");
    const descricao = dialog?.getAttribute("aria-describedby");
    expect(document.getElementById(rotulo ?? "")?.textContent).toBe("Confirmar?");
    expect(document.getElementById(descricao ?? "")?.textContent).toBe("Cadastrar luva");
    expect(document.activeElement?.textContent).toContain("Confirmar");

    await act(async () => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }),
      );
    });
    await esperar(() => dialogoVisivel("alertdialog") === null);

    expect(onCancelar).toHaveBeenCalledOnce();
    expect(onConfirmar).not.toHaveBeenCalled();
    expect(dialogoVisivel("alertdialog")).toBeNull();
  });

  it("dado a confirmação aberta, quando Confirmar é acionado, então só a confirmação segue", async () => {
    const onConfirmar = vi.fn();
    const onCancelar = vi.fn();
    await montar(
      createElement(ConfirmacaoVoz, {
        resumo: "Reabastecer luva",
        onConfirmar,
        onCancelar,
      }),
    );
    await esperar(() => dialogoVisivel("alertdialog") !== null);
    const confirmar = [...document.querySelectorAll("button")].find((botao) => botao.textContent === "Confirmar");
    await act(async () => {
      confirmar?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    expect(onConfirmar).toHaveBeenCalledOnce();
    expect(onCancelar).not.toHaveBeenCalled();
  });
});

describe("campos do papel no dashboard", () => {
  it("dado um bloco marcado, quando o formulário é lido, então o name segue e o valor é on", async () => {
    await montar(createElement(CamposDoPapel, { pendente: false, executar: vi.fn() }));
    const form = document.querySelector("form");
    expect(form).toBeTruthy();
    const rotulo = [...document.querySelectorAll("label")].find((item) =>
      item.textContent?.includes("Faturamento no período"),
    );
    const entrada = rotulo?.querySelector<HTMLInputElement>('input[name="faturamento"]');
    expect(entrada?.type).toBe("checkbox");
    expect(entrada?.name).toBe("faturamento");
    expect(entrada?.value).toBe("on");
    if (entrada) entrada.checked = true;
    const dados = new FormData(form as HTMLFormElement);
    expect(dados.get("faturamento")).toBe("on");
    expect(dados.get("recebido")).toBeNull();
    expect(document.querySelector("select")?.value).toBe("recepcionista");
  });
});

describe("tokens da gestão", () => {
  it("dado o css das telas do escopo, quando se lê a folha, então não há hex e os estados do campo estão nomeados", () => {
    const arquivos = [
      "src/app/dashboard/tela.css",
      "src/app/estoque/tela.css",
      "src/app/retornos/tela.css",
      "src/app/mensagens/tela.css",
      "src/app/voz/tela.css",
    ];
    for (const arquivo of arquivos) {
      const css = readFileSync(arquivo, "utf8");
      expect(css, arquivo).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(css, arquivo).not.toContain("#0f766e");
      expect(css, arquivo).not.toContain("158172");
    }
    const dashboard = readFileSync("src/app/dashboard/tela.css", "utf8");
    expect(dashboard).not.toContain("dashboard-barra");
    expect(dashboard).toContain(":hover");
    expect(dashboard).toContain(":focus-visible");
    expect(dashboard).toContain(":disabled");
    expect(dashboard).toContain('[aria-invalid="true"]');
    expect(dashboard).toContain("var(--paper-");
  });
});
