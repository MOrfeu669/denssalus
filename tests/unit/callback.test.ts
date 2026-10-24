import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.hoisted(() => vi.fn());

vi.mock("../../src/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { exchangeCodeForSession },
  }),
}));

import { GET } from "../../src/app/auth/callback/route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
  });

  it("sem código, responde o contrato de erro", async () => {
    const resposta = await GET(new Request("http://127.0.0.1:3000/auth/callback"));

    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toEqual({
      code: "codigo_ausente",
      message: "Código de recuperação ausente",
    });
  });

  it("quando a troca falha, não devolve a causa ao cliente", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: { message: "stack secreta" } });

    const resposta = await GET(new Request("http://127.0.0.1:3000/auth/callback?code=abc"));

    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toEqual({
      code: "troca_falhou",
      message: "Não foi possível abrir a sessão de recuperação",
    });
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
  });

  it("quando a troca funciona, redireciona para a nova senha", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const resposta = await GET(
      new Request("http://127.0.0.1:3000/auth/callback?code=abc&next=/recuperar/nova-senha"),
    );

    expect(resposta.status).toBe(307);
    expect(resposta.headers.get("location")).toBe("http://127.0.0.1:3000/recuperar/nova-senha");
  });

  it("recusa um destino externo", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const resposta = await GET(
      new Request("http://127.0.0.1:3000/auth/callback?code=abc&next=https://evil.example"),
    );

    expect(resposta.headers.get("location")).toBe("http://127.0.0.1:3000/recuperar/nova-senha");
  });
});
