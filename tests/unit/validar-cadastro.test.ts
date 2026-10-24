import { describe, expect, it } from "vitest";
import { MENSAGEM_PAPEL } from "../../src/domain/auth/tipos";
import { validarCadastro } from "../../src/app/usuarios/validar";

describe("validar cadastro de usuário", () => {
  it("aceita dentista e recepcionista com nome, e-mail e senha", () => {
    const resultado = validarCadastro({
      nome: " Lia ",
      email: "Lia@Clinica.com",
      senha: "senha-lia",
      papel: "recepcionista",
    });

    expect(resultado).toEqual({
      ok: true,
      valor: {
        nome: "Lia",
        email: "lia@clinica.com",
        senha: "senha-lia",
        papel: "recepcionista",
      },
    });
  });

  it("recusa um papel que não seja dentista ou recepcionista", () => {
    const resultado = validarCadastro({
      nome: "Admin Dois",
      email: "dois@clinica.com",
      senha: "senha-admin",
      papel: "admin",
    });

    expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
  });
});
