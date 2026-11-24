// @vitest-environment happy-dom

import { createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Agendamento, OpcoesAgendamento } from "../../src/domain/agendamento/tipos";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined, push: () => undefined, replace: () => undefined }),
  usePathname: () => "/pacientes",
}));

vi.mock("../../src/app/agendamentos/actions", () => ({
  bloquear: vi.fn(),
  cancelar: vi.fn(),
  chegar: vi.fn(),
  criar: vi.fn(),
  emergencia: vi.fn(),
  iniciar: vi.fn(),
}));

vi.mock("../../src/app/retornos/actions", () => ({
  marcar: vi.fn(),
}));

vi.mock("../../src/app/prontuarios/[pacienteId]/actions", () => ({
  registrarEvolucao: vi.fn(),
}));

vi.mock("../../src/app/pacientes/actions", () => ({
  cadastrar: vi.fn(),
  editar: vi.fn(),
}));

import { Agendamentos } from "../../src/app/agendamentos/form";
import { pedirOverlay } from "../../src/app/agendamentos/pedido";
import { Pacientes } from "../../src/app/pacientes/form";
import type { PaginaLista } from "../../src/app/pacientes/tipos-lista";

const paginaVazia: PaginaLista = {
  linhas: [],
  totalFiltrado: 0,
  totalClinica: 0,
  pagina: 1,
  porPagina: 10,
  contagens: { todos: 0, em_tratamento: 0, com_debito: 0, retorno_pendente: 0, aniversariantes: 0 },
};

const consultaVazia = { termo: "", chip: "todos" as const, pagina: 1, porPagina: 10 };

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
  return host;
}

function dialogoVisivel(): HTMLElement | null {
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
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

function botaoCom(texto: string) {
  return [...document.querySelectorAll("button")].find((botao) => botao.textContent?.includes(texto));
}

const opcoes: OpcoesAgendamento = {
  pacientes: [{ id: "pac-1", nome: "João Pereira" }],
  dentistas: [{ id: "den-1", nome: "Ana Lima", usuarioId: "user-2" }],
  cadeiras: [{ id: "cad-1", identificacao: "Cadeira 1" }],
  procedimentos: [{ id: "proc-1", nome: "Limpeza", tempoMedioMinutos: 40 }],
};

const agendamento: Agendamento = {
  id: "ag-1",
  clinicaId: "c1",
  pacienteId: "pac-1",
  dentistaId: "den-1",
  cadeiraId: "cad-1",
  procedimentoId: "proc-1",
  inicio: "2026-11-24T09:00",
  fim: "2026-11-24T09:40",
  status: "em_espera",
  iniciadoPor: null,
  emergencia: false,
  criadoPor: "user-1",
  alertaCadeira: false,
  alertaHorario: false,
  alertaDentista: false,
  motivoCancelamento: null,
  canceladoPor: null,
  canceladoEm: null,
  concluidoEm: null,
};

describe("diálogo de pacientes", () => {
  it("dado a lista, quando Novo paciente abre, então o foco entra no diálogo fora da casca", async () => {
    const host = await montar(createElement(Pacientes, { pagina: paginaVazia, consulta: consultaVazia }));
    const gatilho = botaoCom("Cadastrar paciente");
    expect(gatilho?.getAttribute("aria-haspopup")).toBe("dialog");
    expect(gatilho?.getAttribute("aria-expanded")).toBe("false");
    expect(dialogoVisivel()).toBeNull();

    gatilho?.focus();
    await act(async () => {
      gatilho?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    await esperar(() => dialogoVisivel() !== null);

    const dialog = dialogoVisivel();
    expect(dialog).toBeTruthy();
    expect(host.contains(dialog)).toBe(false);
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.textContent).toContain("Novo paciente");
    expect(dialog?.querySelector('[name="nome"]')).toBeTruthy();
    expect(dialog?.querySelector('[name="canais"]')).toBeTruthy();
    expect(dialog?.contains(document.activeElement)).toBe(true);
    expect(dialog?.className).toContain("bg-card");
    expect(dialog?.className).toContain("border-borda-papel");
  });

  it("dado o diálogo aberto, quando Esc é pressionado, então ele fecha e o foco volta ao botão", async () => {
    await montar(createElement(Pacientes, { pagina: paginaVazia, consulta: consultaVazia }));
    const gatilho = botaoCom("Cadastrar paciente");
    gatilho?.focus();
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

  it("dado o diálogo aberto, quando Fechar é acionado, então ele fecha e o foco volta ao botão", async () => {
    await montar(createElement(Pacientes, { pagina: paginaVazia, consulta: consultaVazia }));
    const gatilho = botaoCom("Cadastrar paciente");
    gatilho?.focus();
    await act(async () => {
      gatilho?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    await esperar(() => dialogoVisivel() !== null);

    const fechar = [...(dialogoVisivel()?.querySelectorAll("button") ?? [])].find((botao) =>
      botao.textContent?.includes("Fechar"),
    );
    await act(async () => {
      fechar?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    await esperar(() => dialogoVisivel() === null);

    expect(dialogoVisivel()).toBeNull();
    expect(document.activeElement).toBe(gatilho);
  });
});

describe("diálogo de agendamentos", () => {
  async function abrir() {
    const host = await montar(
      createElement(Agendamentos, {
        agendamentos: [agendamento],
        opcoes,
        papel: "admin",
        usuarioId: "user-1",
        inicial: { pacienteId: "", dentistaId: "", procedimentoId: "" },
      }),
    );
    const origem = document.createElement("button");
    origem.textContent = "Novo agendamento";
    document.body.appendChild(origem);
    origem.focus();
    await act(async () => {
      pedirOverlay({ destino: "novo", origem });
    });
    await esperar(() => dialogoVisivel() !== null);
    return { host, origem };
  }

  it("dado o pedido da agenda, quando o diálogo abre, então o foco entra fora da casca e os nomes dos campos permanecem", async () => {
    const { host } = await abrir();
    const dialog = dialogoVisivel();
    expect(dialog).toBeTruthy();
    expect(host.contains(dialog)).toBe(false);
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.textContent).toContain("Agendamentos");
    expect(dialog?.querySelector('[name="pacienteId"]')).toBeTruthy();
    expect(dialog?.querySelector('[name="dentistaId"]')).toBeTruthy();
    expect(dialog?.querySelector('[name="cadeiraId"]')).toBeTruthy();
    expect(dialog?.querySelector('[name="inicio"]')).toBeTruthy();
    expect(dialog?.querySelector('[name="fim"]')).toBeTruthy();
    expect(dialog?.querySelector('[name="procedimentoId"]')).toBeTruthy();
    expect(dialog?.textContent).toContain("em espera");
    expect(dialog?.contains(document.activeElement)).toBe(true);
    expect(document.querySelector("[data-slot=dialog-overlay]")?.className).toContain("bg-overlay");
  });

  it("dado o diálogo aberto, quando Esc é pressionado, então ele fecha e o foco volta à origem", async () => {
    const { origem } = await abrir();
    await act(async () => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }),
      );
    });
    await esperar(() => dialogoVisivel() === null);
    expect(dialogoVisivel()).toBeNull();
    expect(document.activeElement).toBe(origem);
  });

  it("dado o diálogo aberto, quando Fechar é acionado, então ele fecha e o foco volta à origem", async () => {
    const { origem } = await abrir();
    const fechar = [...(dialogoVisivel()?.querySelectorAll("button") ?? [])].find((botao) =>
      botao.textContent?.includes("Fechar"),
    );
    await act(async () => {
      fechar?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    await esperar(() => dialogoVisivel() === null);
    expect(dialogoVisivel()).toBeNull();
    expect(document.activeElement).toBe(origem);
  });
});
