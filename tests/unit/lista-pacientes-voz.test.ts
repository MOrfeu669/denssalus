// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { gruposDaCasca } from "../../src/app/casca-menu";
import { telaSemCasca } from "../../src/app/casca-publico";
import { CabecalhoCasca } from "../../src/app/casca-cabecalho";
import { MenuCasca } from "../../src/app/menu-casca";
import { Pacientes } from "../../src/app/pacientes/form";
import type { PaginaLista } from "../../src/app/pacientes/tipos-lista";
import { AtalhoVoz } from "../../src/app/voz/atalho";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/pacientes",
}));

vi.mock("../../src/app/pacientes/actions", () => ({
  cadastrar: vi.fn(),
  editar: vi.fn(),
}));

vi.mock("../../src/app/pacientes/actions-lista", () => ({
  exportarCsv: vi.fn(),
  lerParaEditar: vi.fn(),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

const pagina: PaginaLista = {
  linhas: [],
  totalFiltrado: 0,
  totalClinica: 3,
  pagina: 1,
  porPagina: 10,
  contagens: { todos: 3, em_tratamento: 1, com_debito: 0, retorno_pendente: 0, aniversariantes: 0 },
};

afterEach(async () => {
  for (const root of roots.splice(0)) {
    await act(async () => {
      root.unmount();
    });
  }
  document.body.innerHTML = "";
});

describe("voz e casca na lista de pacientes", () => {
  it("dado a lista aberta, quando a casca renderiza, então a voz segue no cabeçalho, na lateral e no botão fixo", async () => {
    expect(telaSemCasca("/pacientes")).toBe(false);
    expect(readFileSync("src/app/layout.tsx", "utf8")).toContain("<BotaoVoz");
    expect(readFileSync("src/app/voz/botao-voz.tsx", "utf8")).toContain("data-voz-flutuante");

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);
    const clique = vi.fn();
    await act(async () => {
      root.render(
        createElement(
          "div",
          null,
          createElement(CabecalhoCasca, {
            sino: createElement("button", { type: "button", "aria-label": "Notificações" }, "sino"),
          }),
          createElement(MenuCasca, { grupos: gruposDaCasca("recepcionista") }),
          createElement(Pacientes, {
            pagina,
            consulta: { termo: "", chip: "todos", pagina: 1, porPagina: 10 },
          }),
          createElement("button", { type: "button", "data-voz-flutuante": "", onClick: clique }, "voz"),
          createElement(AtalhoVoz),
        ),
      );
    });

    const html = host.innerHTML;
    expect(html).toContain('href="/voz"');
    expect(html).toContain("Assistente de voz");
    expect(html).toContain('aria-label="Filtrar a lista de pacientes"');
    expect(html).toContain('aria-label="Buscar paciente, CPF ou telefone"');
    expect(html).toContain("data-voz-flutuante");
    expect(html).not.toContain("Ajuda");
    expect(html.indexOf("Assistente de voz")).toBeLessThan(html.indexOf("Notificações"));

    const atalho = host.querySelector<HTMLButtonElement>('button[aria-label="Assistente de voz"]');
    await act(async () => {
      atalho?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(clique).toHaveBeenCalledOnce();
  });

  it("dado a casca desta tela, quando há contador de mensagens, então o item Mensagens não mostra o número", () => {
    const lateral = readFileSync("src/app/casca-lateral.tsx", "utf8");
    expect(lateral).toContain("{clinicaNome}");
    expect(lateral).not.toContain("<select");
    expect(readFileSync("src/app/casca-cabecalho.tsx", "utf8")).not.toContain("Ajuda");

    const html = renderToStaticMarkup(
      createElement(MenuCasca, {
        grupos: gruposDaCasca("admin"),
        contadores: { "/mensagens": 4, "/retornos": 2 },
      }),
    );
    const mensagens = html.split('href="/mensagens"')[1]?.split("</a>")[0] ?? "";
    const retornos = html.split('href="/retornos"')[1]?.split("</a>")[0] ?? "";
    expect(mensagens).toContain("Mensagens");
    expect(mensagens).not.toContain(">4<");
    expect(retornos).toContain(">2<");
  });
});
