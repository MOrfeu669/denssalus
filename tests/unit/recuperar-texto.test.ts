import { describe, expect, it } from "vitest";
import { confirmacaoConfere } from "../../src/app/recuperar/confirmacao";
import { TEXTO_NOVA_SENHA, TEXTO_RECUPERAR } from "../../src/app/recuperar/texto";

describe("textos da tela Esqueci a senha", () => {
  it("quando o pedido está pendente, então o botão diz Enviando… e o link volta ao login", () => {
    expect(TEXTO_RECUPERAR.titulo).toBe("Esqueci a senha");
    expect(TEXTO_RECUPERAR.enviando).toBe("Enviando…");
    expect(TEXTO_RECUPERAR.voltar).toBe("Voltar ao login");
    expect(TEXTO_RECUPERAR.rotuloEmail).toBe("E-mail");
  });
});

describe("textos da tela Nova senha", () => {
  it("dado o frame 03, então a ação é Salvar, pendente Salvando… e o sucesso leva a Entrar", () => {
    expect(TEXTO_NOVA_SENHA.salvar).toBe("Salvar");
    expect(TEXTO_NOVA_SENHA.salvando).toBe("Salvando…");
    expect(TEXTO_NOVA_SENHA.entrar).toBe("Entrar");
  });

  it("quando a confirmação difere, então o erro tem o texto do frame", () => {
    expect(TEXTO_NOVA_SENHA.confirmacaoDiferente).toBe("A confirmação não é igual à nova senha.");
  });

  it("os campos têm rótulo de nova senha e confirmação", () => {
    expect(TEXTO_NOVA_SENHA.rotuloSenha).toBe("Nova senha");
    expect(TEXTO_NOVA_SENHA.rotuloConfirmacao).toBe("Confirmação");
  });
});

describe("conferência da confirmação (só na tela)", () => {
  it("dadas senhas iguais, então confere", () => {
    expect(confirmacaoConfere("segredo1", "segredo1")).toBe(true);
  });

  it("dadas senhas diferentes, então não confere", () => {
    expect(confirmacaoConfere("segredo1", "segredo2")).toBe(false);
    expect(confirmacaoConfere("segredo1", "Segredo1")).toBe(false);
    expect(confirmacaoConfere("segredo1", "")).toBe(false);
  });
});
