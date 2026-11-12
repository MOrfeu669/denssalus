import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Dentista } from "../../src/domain/dentista/tipos";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined }),
}));

vi.mock("../../src/app/dentistas/actions", () => ({
  cadastrar: vi.fn(),
  editar: vi.fn(),
  remover: vi.fn(),
}));

import { Dentistas } from "../../src/app/dentistas/form";

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

describe("cadastro de dentista na tela", () => {
  it("dado a lista, quando a tela abre, então o formulário fica atrás do botão", () => {
    const html = renderToStaticMarkup(createElement(Dentistas, { dentistas: [rui] }));

    expect(html).toContain("Cadastrar dentista");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('name="email"');
    expect(html).toContain("Rui Costa");
    expect(html).toContain("Dentistas da clínica");
  });
});
