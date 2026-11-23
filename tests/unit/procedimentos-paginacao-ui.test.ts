import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Procedimento } from "../../src/domain/procedimento/tipos";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined }),
}));

vi.mock("../../src/app/procedimentos/actions", () => ({
  cadastrar: vi.fn(),
  editar: vi.fn(),
  excluir: vi.fn(),
}));

import { Procedimentos } from "../../src/app/procedimentos/form";

function proc(id: string): Procedimento {
  return {
    id,
    clinicaId: "c1",
    nome: `Procedimento ${id}`,
    tempoMedioMinutos: 30,
    valorMedio: 100,
  };
}

describe("lista de procedimentos na tela", () => {
  it("dado mais de 15 procedimentos, quando a tela abre, então mostra busca e controle de ver mais", () => {
    const lista = Array.from({ length: 16 }, (_, i) => proc(String(i + 1)));
    const html = renderToStaticMarkup(
      createElement(Procedimentos, {
        procedimentos: lista,
        podeExcluir: true,
        materiais: [],
      }),
    );

    expect(html).toContain("Buscar procedimentos");
    expect(html).toContain("Mostrar mais procedimentos");
    expect(html).toContain("Mostrando 15 de 16");
    expect(html).toContain("Procedimento 15");
    expect(html).not.toContain("Procedimento 16");
  });
});
