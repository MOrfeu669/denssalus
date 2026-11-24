// @vitest-environment happy-dom

import { createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApresentacaoDashboard, ResumoDashboard } from "../../src/domain/dashboard/tipos";
import type { MaterialTela } from "../../src/app/estoque/form";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("../../src/app/dashboard/actions", () => ({
  salvarCamposDoPapel: vi.fn(),
  salvarPreferencia: vi.fn(),
  exportarResumo: vi.fn(),
}));

vi.mock("../../src/app/estoque/actions", () => ({
  cadastrarMaterial: vi.fn(),
  reabastecerMaterial: vi.fn(),
}));

import { CabecalhoCasca } from "../../src/app/casca-cabecalho";
import { gruposDaCasca } from "../../src/app/casca-menu";
import { Painel } from "../../src/app/dashboard/painel";
import { Estoque } from "../../src/app/estoque/form";
import { MenuCasca } from "../../src/app/menu-casca";
import { AtalhoVoz } from "../../src/app/voz/atalho";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

afterEach(async () => {
  for (const root of roots.splice(0)) {
    await act(async () => root.unmount());
  }
  document.body.innerHTML = "";
});

const resumo: ResumoDashboard = {
  periodo: { inicio: "2026-11-01", fim: "2026-11-30" },
  faturado: 100,
  recebido: 40,
  despesaProtese: 0,
  porDentista: [],
  porProcedimento: [],
  ocupacao: 10,
  estoque: [],
};

const apresentacao: ApresentacaoDashboard = {
  diario: [{ data: "2026-11-24", valor: 100 }],
  metaDiaria: null,
  aReceber: { valor: 60, debitos: 1 },
  dentistas: [],
  procedimentos: [],
  variacaoFaturado: null,
  variacaoOcupacao: null,
  parteRecebida: 40,
  trabalhosProtese: 0,
};

const luva: MaterialTela = {
  id: "m1",
  nome: "Luva",
  quantidade: 2,
  quantidadeMinima: 6,
  validade: "2026-12-01",
  historico: [],
};

async function montar(node: ReactNode) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(node));
}

describe("voz nas telas de dashboard e estoque", () => {
  it("dado o dashboard e o estoque na casca, quando as telas abrem, então a rota /voz, o microfone e o botão fixo continuam acessíveis", async () => {
    const grupos = gruposDaCasca("admin");
    await montar(
      createElement(
        "div",
        null,
        createElement(MenuCasca, { grupos, contadores: { "/mensagens": 3, "/retornos": 6 } }),
        createElement(CabecalhoCasca, {
          busca: createElement("div", null, "busca"),
          sino: createElement("button", { type: "button", "aria-label": "Notificações" }, "sino"),
        }),
        createElement(Painel, {
          papel: "recepcionista",
          resumo,
          apresentacao,
          ocultos: [],
          periodoSalvo: "mes",
          agora: "2026-11-24T15:58:00.000Z",
        }),
        createElement(Estoque, { materiais: [luva], hoje: "2026-11-24" }),
        createElement(AtalhoVoz),
        createElement("button", { type: "button", "data-voz-flutuante": "" }, "Assistente de voz"),
      ),
    );

    const html = document.body.innerHTML;
    expect(html).toContain('href="/voz"');
    expect(html).toContain("Assistente de voz");
    expect(html).toContain("data-voz-flutuante");
    expect(document.querySelector("[data-voz-flutuante]")).toBeTruthy();
    expect(document.querySelectorAll('[aria-label="Assistente de voz"]').length).toBeGreaterThan(0);
    expect(html).toContain("Exportar CSV");
    expect(html).toContain("Cadastrar material");
    expect(html).toContain("Dias úteis do período");
    expect(html).not.toContain("meta diária");
    expect(document.querySelector('a[href="/mensagens"]')?.textContent).toBe("Mensagens");
    expect(document.querySelector('a[href="/retornos"]')?.textContent).toContain("6");
    expect(document.querySelector('[aria-label="Ajuda"]')).toBeNull();
    expect(document.querySelector("select[aria-label*='clínica' i], select[aria-label*='clinica' i]")).toBeNull();
  });
});
