import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Usuario } from "../../src/domain/auth/tipos";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined }),
}));

vi.mock("../../src/app/usuarios/actions", () => ({
  cadastrar: vi.fn(),
  remover: vi.fn(),
}));

import { Painel } from "../../src/app/usuarios/painel";

const usuarios: Usuario[] = [
  {
    id: "u1",
    nome: "Ana",
    email: "ana@ex.com",
    papel: "admin",
    clinicaId: "c1",
    ativo: true,
  },
  {
    id: "u2",
    nome: "Bruno",
    email: "bruno@ex.com",
    papel: "dentista",
    clinicaId: "c1",
    ativo: true,
  },
];

describe("painel de usuários", () => {
  it("dado a lista, quando a tela abre, então oferece busca, filtro de papel e remoção com confirmação", () => {
    const html = renderToStaticMarkup(
      createElement(Painel, { usuarios, atualId: "u1" }),
    );

    expect(html).toContain("Buscar usuários");
    expect(html).toContain("Filtrar por papel");
    expect(html).toContain('aria-label="Remover acesso de Bruno"');
    expect(html).toContain("Remover acesso");
    expect(html).not.toContain('role="alertdialog"');
  });
});
