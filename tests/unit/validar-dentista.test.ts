import { describe, expect, it } from "vitest";
import {
  lerEspecialidades,
  validarCadastroDentista,
  validarEdicao,
} from "../../src/app/dentistas/validar";

const base = {
  nome: " Dra. Ana Souza ",
  email: " Ana@Clinica.test ",
  senha: "segredo1",
  cro: " CRO-SP 12345 ",
  telefone: " (11) 90000-0000 ",
  cpf: " 000.000.000-00 ",
  especialidades: "",
};

describe("validar cadastro de dentista", () => {
  it("aceita nome, e-mail, senha, CRO, telefone e CPF e limpa os espaços", () => {
    expect(validarCadastroDentista(base)).toEqual({
      ok: true,
      valor: {
        nome: "Dra. Ana Souza",
        email: "ana@clinica.test",
        senha: "segredo1",
        cro: "CRO-SP 12345",
        telefone: "(11) 90000-0000",
        cpf: "000.000.000-00",
        especialidades: [],
      },
    });
  });

  it("recusa nome em branco", () => {
    expect(validarCadastroDentista({ ...base, nome: "  " })).toEqual({
      ok: false,
      mensagem: "Informe o nome",
    });
  });

  it("recusa e-mail sem arroba", () => {
    expect(validarCadastroDentista({ ...base, email: "ana.clinica.test" })).toEqual({
      ok: false,
      mensagem: "Informe um e-mail válido",
    });
  });

  it("recusa senha com menos de 6 caracteres e aceita com 6", () => {
    expect(validarCadastroDentista({ ...base, senha: "12345" })).toEqual({
      ok: false,
      mensagem: "A senha precisa ter pelo menos 6 caracteres",
    });
    expect(validarCadastroDentista({ ...base, senha: "123456" }).ok).toBe(true);
  });

  it("recusa CRO, telefone e CPF em branco, cada um com a própria mensagem", () => {
    expect(validarCadastroDentista({ ...base, cro: " " })).toEqual({
      ok: false,
      mensagem: "Informe o CRO",
    });
    expect(validarCadastroDentista({ ...base, telefone: "" })).toEqual({
      ok: false,
      mensagem: "Informe o telefone",
    });
    expect(validarCadastroDentista({ ...base, cpf: "" })).toEqual({
      ok: false,
      mensagem: "Informe o CPF",
    });
  });
});

describe("validar edição de dentista", () => {
  it("aceita nome, CRO, telefone e CPF sem pedir e-mail nem senha", () => {
    expect(
      validarEdicao({
        nome: "Dra. Ana Souza",
        cro: "CRO-SP 12345",
        telefone: "(11) 91111-1111",
        cpf: "000.000.000-00",
        especialidades: "Endodontia",
      }),
    ).toEqual({
      ok: true,
      valor: {
        nome: "Dra. Ana Souza",
        cro: "CRO-SP 12345",
        telefone: "(11) 91111-1111",
        cpf: "000.000.000-00",
        especialidades: ["Endodontia"],
      },
    });
  });

  it("recusa telefone em branco", () => {
    expect(
      validarEdicao({ nome: "Ana", cro: "1", telefone: " ", cpf: "1", especialidades: "" }),
    ).toEqual({ ok: false, mensagem: "Informe o telefone" });
  });
});

describe("ler especialidades", () => {
  it("texto vazio vira lista vazia", () => {
    expect(lerEspecialidades("")).toEqual([]);
    expect(lerEspecialidades(" , ,, ")).toEqual([]);
  });

  it("separa por vírgula, tira espaço, vazio e repetição", () => {
    expect(lerEspecialidades(" Endodontia, Ortodontia ,, endodontia, Implantes ")).toEqual([
      "Endodontia",
      "Ortodontia",
      "Implantes",
    ]);
  });
});
