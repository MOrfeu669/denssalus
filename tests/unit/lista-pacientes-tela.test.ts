// @vitest-environment happy-dom

import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEBOUNCE_FILTRO_MS } from "../../src/app/pacientes/consulta";
import { ListaPacientes } from "../../src/app/pacientes/lista";
import type { PaginaLista } from "../../src/app/pacientes/tipos-lista";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/pacientes",
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

const pagina: PaginaLista = {
  linhas: [
    {
      id: "joao",
      nome: "João Pedro",
      iniciais: "JP",
      complemento: "jp@email.com",
      cpf: "•••.482.317-••",
      telefone: "(11) 98123-7790",
      ultimaVisita: "11/11/2026",
      proximaConsulta: "25/11 · 10:30",
      situacao: "em_tratamento",
    },
  ],
  totalFiltrado: 1,
  totalClinica: 1,
  pagina: 1,
  porPagina: 10,
  contagens: { todos: 1, em_tratamento: 1, com_debito: 0, retorno_pendente: 0, aniversariantes: 0 },
};

const consulta = { termo: "", chip: "todos" as const, pagina: 1, porPagina: 10 };

afterEach(async () => {
  replace.mockClear();
  for (const root of roots.splice(0)) {
    await act(async () => {
      root.unmount();
    });
  }
  document.body.innerHTML = "";
});

async function montar() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => {
    root.render(
      createElement(ListaPacientes, {
        pagina,
        consulta,
        selecionados: [],
        onSelecionar: () => undefined,
        onEditar: () => undefined,
      }),
    );
  });
  return host;
}

function digitar(valor: string) {
  const campo = document.querySelector<HTMLInputElement>('[aria-label="Filtrar a lista de pacientes"]');
  const definir = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  definir?.call(campo, valor);
  campo?.dispatchEvent(new Event("input", { bubbles: true }));
  campo?.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("filtro ao vivo na tela", () => {
  it("dado o nome, quando digita, então a consulta vai ao servidor sem Enter", async () => {
    await montar();
    await act(async () => {
      digitar("joao");
    });
    expect(replace).not.toHaveBeenCalled();
    const campo = document.querySelector<HTMLInputElement>('[aria-label="Filtrar a lista de pacientes"]');
    expect(campo?.value).toBe("joao");

    await act(async () => {
      campo?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(replace).not.toHaveBeenCalled();

    await act(async () => {
      await new Promise((resolver) => setTimeout(resolver, DEBOUNCE_FILTRO_MS + 40));
    });
    expect(replace).toHaveBeenCalledWith("/pacientes?q=joao");
  });

  it("dado o chip Com débito, quando aciona, então a consulta combina na hora", async () => {
    await montar();
    const chip = [...document.querySelectorAll("button")].find((botao) => botao.textContent?.includes("Com débito"));
    await act(async () => {
      chip?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(replace).toHaveBeenCalledWith("/pacientes?chip=com_debito");
  });
});
