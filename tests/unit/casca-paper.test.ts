// @vitest-environment happy-dom

import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Notificacao } from "../../src/domain/notificacao/tipos";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("../../src/app/auth/actions", () => ({
  pedirRecuperacao: vi.fn(),
  definirSenha: vi.fn(),
}));

vi.mock("../../src/app/notificacoes/actions", () => ({
  marcarComoLida: vi.fn(),
}));

import { FormNovaSenha } from "../../src/app/recuperar/nova-senha/form";
import { FormRecuperar } from "../../src/app/recuperar/form";
import { SinoPainel } from "../../src/app/sino-painel";

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

const notificacao = (parcial: Partial<Notificacao> & Pick<Notificacao, "id" | "mensagem">): Notificacao => ({
  clinicaId: "cli_ficticia",
  destinatarioId: "usr_ficticio",
  tipo: "paciente_aguardando",
  urgencia: "normal",
  referenciaId: "ref",
  lida: false,
  resolvida: false,
  criadaEm: "2026-11-24T12:00:00.000Z",
  ...parcial,
});

describe("recuperar senha no Paper", () => {
  it("dado o pedido de link, quando a tela abre, então o campo e o botão usam a coleção e não o visual do login", () => {
    const html = renderToStaticMarkup(createElement(FormRecuperar));

    expect(html).toContain("Esqueci a senha");
    expect(html).toContain('name="email"');
    expect(html).toContain('type="email"');
    expect(html).toContain('autoComplete="username"');
    expect(html).toContain("Enviar link de recuperação");
    expect(html).toContain('href="/login"');
    expect(html).toContain('data-slot="input"');
    expect(html).toContain('data-slot="label"');
    expect(html).toContain('type="submit"');
    expect(html).not.toContain("entrar-botao");
    expect(html).not.toContain("entrar-form");
    expect(html).not.toContain("cor-login");
  });

  it("dada a nova senha, quando a tela abre, então senha e confirmação seguem o mesmo contrato", () => {
    const html = renderToStaticMarkup(createElement(FormNovaSenha));

    expect(html).toContain("Nova senha");
    expect(html).toContain('name="senha"');
    expect(html).toContain('name="confirmacao"');
    expect(html).toContain('autoComplete="new-password"');
    expect(html).toContain("Salvar");
    expect(html).toContain('data-slot="input"');
    expect(html).not.toContain("entrar-botao");
    expect(html).not.toContain("entrar-caixa");
  });
});

describe("sino no Paper", () => {
  it("dadas duas pendências, quando o sino renderiza, então o rótulo, o controle e o selo permanecem", () => {
    const html = renderToStaticMarkup(
      createElement(SinoPainel, {
        erro: "",
        notificacoes: [
          notificacao({ id: "ntf_1", mensagem: "João Silva aguarda na recepção." }),
          notificacao({
            id: "ntf_2",
            mensagem: "Estoque de luva abaixo do mínimo.",
            urgencia: "critica",
            tipo: "estoque_abaixo_minimo",
          }),
        ],
      }),
    );

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="sino-painel"');
    expect(html).toContain('aria-label="Notificações, 2 pendentes"');
    expect(html).toContain('data-slot="badge"');
    expect(html).toContain(">2<");
    expect(html).not.toContain('id="sino-painel"');
  });

  it("dado o sino aberto, quando Esc é pressionado, então o painel fecha e o foco volta ao botão", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);
    await act(async () => {
      root.render(
        createElement(SinoPainel, {
          erro: "",
          notificacoes: [notificacao({ id: "ntf_1", mensagem: "João Silva aguarda na recepção." })],
        }),
      );
    });

    const botao = document.querySelector<HTMLButtonElement>('[aria-controls="sino-painel"]');
    expect(botao?.getAttribute("aria-expanded")).toBe("false");
    await act(async () => {
      botao?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(document.getElementById("sino-painel")).toBeTruthy();
    expect(botao?.getAttribute("aria-expanded")).toBe("true");

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    expect(document.getElementById("sino-painel")).toBeNull();
    expect(botao?.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(botao);
  });
});
