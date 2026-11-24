// @vitest-environment happy-dom

import { createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Dentista } from "../../src/domain/dentista/tipos";
import type { Procedimento } from "../../src/domain/procedimento/tipos";
import type { Usuario } from "../../src/domain/auth/tipos";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined }),
}));

vi.mock("../../src/app/usuarios/actions", () => ({
  cadastrar: vi.fn(),
  remover: vi.fn(),
}));

vi.mock("../../src/app/dentistas/actions", () => ({
  cadastrar: vi.fn(),
  editar: vi.fn(),
  remover: vi.fn(),
}));

vi.mock("../../src/app/procedimentos/actions", () => ({
  cadastrar: vi.fn(),
  editar: vi.fn(),
  excluir: vi.fn(),
}));

import { Alerta as AlertaClinica } from "../../src/app/clinica/alerta";
import { Dentistas } from "../../src/app/dentistas/form";
import { Alerta as AlertaDentistas } from "../../src/app/dentistas/alerta";
import { Procedimentos } from "../../src/app/procedimentos/form";
import { Alerta as AlertaUsuarios } from "../../src/app/usuarios/alerta";
import { Painel } from "../../src/app/usuarios/painel";

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
  host.className = "casca";
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

async function abrir(rotulo: string) {
  const gatilho = [...document.querySelectorAll("button")].find(
    (botao) => botao.textContent?.trim() === rotulo && botao.getAttribute("aria-haspopup") === "dialog",
  );
  expect(gatilho).toBeTruthy();
  await act(async () => {
    gatilho?.click();
  });
  await esperar(() => dialogoVisivel() !== null);
  return gatilho as HTMLButtonElement;
}

async function fecharPeloBotao() {
  const dialog = dialogoVisivel();
  const fechar = [...(dialog?.querySelectorAll("button") ?? [])].find((botao) =>
    botao.textContent?.includes("Fechar"),
  );
  expect(fechar).toBeTruthy();
  await act(async () => {
    fechar?.click();
  });
  await esperar(() => dialogoVisivel() === null);
}

async function fecharPeloEsc() {
  await act(async () => {
    document.activeElement?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }),
    );
  });
  await esperar(() => dialogoVisivel() === null);
}

const ana: Usuario = {
  id: "u1",
  nome: "Ana",
  email: "ana@ex.com",
  papel: "admin",
  clinicaId: "c1",
  ativo: true,
};

const bruno: Usuario = {
  id: "u2",
  nome: "Bruno",
  email: "bruno@ex.com",
  papel: "dentista",
  clinicaId: "c1",
  ativo: true,
};

const rui: Dentista = {
  id: "d1",
  usuarioId: "u1",
  clinicaId: "c1",
  nome: "Rui Costa",
  cro: "12345",
  telefone: "11999999999",
  cpf: "12345678901",
  especialidades: ["Ortodontia"],
  ativo: true,
};

const limpeza: Procedimento = {
  id: "p1",
  clinicaId: "c1",
  nome: "Limpeza",
  tempoMedioMinutos: 30,
  valorMedio: 120,
};

describe("foco dos diálogos admin", () => {
  it("dado o cadastro de usuário, quando abre, Esc e Fechar devolvem o foco ao gatilho", async () => {
    await montar(createElement(Painel, { usuarios: [ana, bruno], atualId: "u1" }));

    const gatilho = await abrir("Cadastrar usuário");
    const dialog = dialogoVisivel();
    expect(dialog?.contains(document.activeElement)).toBe(true);
    expect(document.querySelector(".casca")?.contains(dialog ?? null)).toBe(false);
    expect(document.querySelector("[data-slot=dialog-overlay]")?.className).toContain("bg-overlay");
    expect(dialog?.className).toContain("shadow-paper-overlay");
    expect((document.activeElement as HTMLInputElement).name).toBe("nome");
    expect(dialog?.querySelector('[name="email"]')).toBeTruthy();
    expect(dialog?.querySelector('[name="senha"]')).toBeTruthy();
    expect(dialog?.querySelector('[name="papel"]')).toBeTruthy();

    await fecharPeloEsc();
    expect(document.activeElement).toBe(gatilho);

    await abrir("Cadastrar usuário");
    await fecharPeloBotao();
    expect(document.activeElement).toBe(gatilho);
  });

  it("dado a remoção de acesso, quando Esc ou Cancelar fecham, o foco volta ao gatilho", async () => {
    await montar(createElement(Painel, { usuarios: [ana, bruno], atualId: "u1" }));
    const gatilho = [...document.querySelectorAll("button")].find(
      (botao) => botao.getAttribute("aria-label") === "Remover acesso de Bruno",
    );
    expect(gatilho).toBeTruthy();
    await act(async () => {
      gatilho?.click();
    });
    await esperar(() => dialogoVisivel() !== null);

    const dialog = dialogoVisivel();
    expect(dialog?.getAttribute("role")).toBe("alertdialog");
    expect(dialog?.contains(document.activeElement)).toBe(true);
    expect(dialog?.textContent).toContain("Bruno");
    expect(dialog?.querySelector('[name="id"]')?.getAttribute("value")).toBe("u2");

    await fecharPeloEsc();
    expect(document.activeElement).toBe(gatilho);

    await act(async () => {
      gatilho?.click();
    });
    await esperar(() => dialogoVisivel() !== null);
    const cancelar = [...(dialogoVisivel()?.querySelectorAll("button") ?? [])].find((botao) =>
      botao.textContent?.includes("Cancelar"),
    );
    await act(async () => {
      cancelar?.click();
    });
    await esperar(() => dialogoVisivel() === null);
    expect(document.activeElement).toBe(gatilho);
  });

  it("dado o cadastro de dentista, quando abre e fecha, o foco entra e volta ao gatilho", async () => {
    await montar(createElement(Dentistas, { dentistas: [rui] }));
    const gatilho = await abrir("Cadastrar dentista");
    const dialog = dialogoVisivel();
    expect(dialog?.contains(document.activeElement)).toBe(true);
    expect(document.querySelector(".casca")?.contains(dialog ?? null)).toBe(false);
    expect((document.activeElement as HTMLInputElement).name).toBe("nome");
    expect(dialog?.querySelector('[name="email"]')).toBeTruthy();
    expect(dialog?.querySelector('[name="cro"]')).toBeTruthy();
    expect(dialog?.className).toContain("shadow-paper-overlay");

    await fecharPeloEsc();
    expect(document.activeElement).toBe(gatilho);

    await abrir("Cadastrar dentista");
    await fecharPeloBotao();
    expect(document.activeElement).toBe(gatilho);
  });

  it("dado o novo procedimento, quando abre e fecha, o foco entra e volta ao gatilho", async () => {
    await montar(
      createElement(Procedimentos, { procedimentos: [limpeza], podeExcluir: true, materiais: [] }),
    );
    const gatilho = await abrir("Novo procedimento");
    const dialog = dialogoVisivel();
    expect(dialog?.contains(document.activeElement)).toBe(true);
    expect(document.querySelector(".casca")?.contains(dialog ?? null)).toBe(false);
    expect((document.activeElement as HTMLInputElement).name).toBe("nome");
    expect(dialog?.querySelector('[name="tempoMedioMinutos"]')).toBeTruthy();
    expect(dialog?.querySelector('[name="valorMedio"]')).toBeTruthy();
    expect(document.querySelector("[data-slot=dialog-overlay]")?.className).toContain("bg-overlay");

    await fecharPeloEsc();
    expect(document.activeElement).toBe(gatilho);

    await abrir("Novo procedimento");
    await fecharPeloBotao();
    expect(document.activeElement).toBe(gatilho);
  });
});

describe("ícone de sucesso do Paper", () => {
  it("dado o aviso de sucesso, quando renderiza, então usa o token de sucesso e não o verde antigo", () => {
    for (const Alerta of [AlertaUsuarios, AlertaClinica, AlertaDentistas]) {
      const html = renderToStaticMarkup(
        createElement(Alerta, { status: "sucesso", mensagem: "Salvo", quando: 1 }),
      );
      expect(html).toContain("text-ok");
      expect(html).toContain("currentColor");
      expect(html).not.toContain("#178A4C");
    }
  });
});
