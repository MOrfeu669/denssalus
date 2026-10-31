import { describe, expect, it } from "vitest";
import { DETALHE_CREDENCIAIS, detalheSessaoAberta } from "../../src/app/login/texto";

describe("textos da tela Entrar", () => {
  it("dado nome e papel, quando a sessão abre, então o aviso diz quem entrou", () => {
    expect(detalheSessaoAberta("Ana", "dentista")).toBe(
      "Você entrou como Ana (Dentista). Continue para o Início.",
    );
    expect(detalheSessaoAberta("Lia", "recepcionista")).toBe(
      "Você entrou como Lia (Recepcionista). Continue para o Início.",
    );
    expect(detalheSessaoAberta("Helena", "admin")).toBe(
      "Você entrou como Helena (Admin). Continue para o Início.",
    );
  });

  it("quando as credenciais falham, então o detalhe pede para conferir e-mail e senha", () => {
    expect(DETALHE_CREDENCIAIS).toBe(
      "E-mail ou senha incorretos. Confira os dados e tente novamente.",
    );
  });
});
