import { describe, expect, it } from "vitest";
import { lerCanais, validarPaciente } from "../../src/app/pacientes/validar";

const hoje = new Date(2026, 9, 25);

const whatsapp = { canal: "whatsapp", contato: " 11 90000-0000 ", preferido: false };
const email = { canal: "email", contato: "ana@exemplo.test", preferido: true };

const base = {
  nome: " Ana Lima ",
  canais: JSON.stringify([whatsapp]),
  cpf: "",
  endereco: "",
  dataNascimento: "",
  sexo: "",
  responsavelNome: "",
  responsavelCpf: "",
  responsavelTelefone: "",
};

describe("validar cadastro de paciente", () => {
  it("aceita só nome e um canal, limpa espaços e deixa o canal único como preferido", () => {
    expect(validarPaciente(base, hoje)).toEqual({
      ok: true,
      valor: {
        nome: "Ana Lima",
        canais: [{ canal: "whatsapp", contato: "11 90000-0000", preferido: true }],
        cpf: null,
        endereco: null,
        dataNascimento: null,
        sexo: null,
        responsavel: null,
      },
    });
  });

  it("recusa nome em branco", () => {
    expect(validarPaciente({ ...base, nome: "  " }, hoje)).toEqual({
      ok: false,
      mensagem: "Informe o nome do paciente",
    });
  });

  it("recusa lista de canais vazia, JSON inválido e contato em branco", () => {
    const mensagem = "Informe ao menos um canal";
    expect(validarPaciente({ ...base, canais: "[]" }, hoje)).toEqual({ ok: false, mensagem });
    expect(validarPaciente({ ...base, canais: "não é json" }, hoje)).toEqual({ ok: false, mensagem });
    const vazio = JSON.stringify([{ canal: "sms", contato: "  ", preferido: true }]);
    expect(validarPaciente({ ...base, canais: vazio }, hoje)).toEqual({ ok: false, mensagem });
  });

  it("com dois canais, exige exatamente um preferido", () => {
    const mensagem = "Marque exatamente um canal preferido";
    const nenhum = JSON.stringify([whatsapp, { ...email, preferido: false }]);
    const dois = JSON.stringify([{ ...whatsapp, preferido: true }, email]);
    expect(validarPaciente({ ...base, canais: nenhum }, hoje)).toEqual({ ok: false, mensagem });
    expect(validarPaciente({ ...base, canais: dois }, hoje)).toEqual({ ok: false, mensagem });
    expect(validarPaciente({ ...base, canais: JSON.stringify([whatsapp, email]) }, hoje).ok).toBe(true);
  });

  it("guarda CPF, endereço, nascimento e sexo opcionais já limpos", () => {
    const resultado = validarPaciente(
      {
        ...base,
        cpf: " 111.111.111-11 ",
        endereco: " Rua A, 10 ",
        dataNascimento: "1990-05-10",
        sexo: "feminino",
      },
      hoje,
    );
    expect(resultado).toMatchObject({
      ok: true,
      valor: {
        cpf: "111.111.111-11",
        endereco: "Rua A, 10",
        dataNascimento: "1990-05-10",
        sexo: "feminino",
        responsavel: null,
      },
    });
  });

  it("recusa sexo desconhecido", () => {
    expect(validarPaciente({ ...base, sexo: "x" }, hoje)).toEqual({
      ok: false,
      mensagem: "Informe um sexo válido",
    });
  });

  it("recusa data de nascimento inexistente, mal formatada ou futura", () => {
    const mensagem = "Informe uma data de nascimento válida";
    for (const dataNascimento of ["2026-02-30", "10/05/1990", "2026-10-26"]) {
      expect(validarPaciente({ ...base, dataNascimento }, hoje)).toEqual({ ok: false, mensagem });
    }
    expect(validarPaciente({ ...base, dataNascimento: "2000-10-25" }, hoje).ok).toBe(true);
  });

  it("menor de 18 anos exige nome e CPF do responsável, cada um com a própria mensagem", () => {
    const menor = { ...base, dataNascimento: "2015-03-20" };
    expect(validarPaciente(menor, hoje)).toEqual({
      ok: false,
      mensagem: "Informe o nome do responsável",
    });
    expect(validarPaciente({ ...menor, responsavelNome: "Marta Lima" }, hoje)).toEqual({
      ok: false,
      mensagem: "Informe o CPF do responsável",
    });
  });

  it("menor com responsável grava os dados, e o telefone é opcional", () => {
    const menor = {
      ...base,
      dataNascimento: "2015-03-20",
      responsavelNome: " Marta Lima ",
      responsavelCpf: " 222.222.222-22 ",
    };
    expect(validarPaciente(menor, hoje)).toMatchObject({
      ok: true,
      valor: { responsavel: { nome: "Marta Lima", cpf: "222.222.222-22", telefone: null } },
    });
    expect(
      validarPaciente({ ...menor, responsavelTelefone: " 11 98888-0000 " }, hoje),
    ).toMatchObject({ ok: true, valor: { responsavel: { telefone: "11 98888-0000" } } });
  });

  it("maior de idade ou sem data de nascimento não leva responsável", () => {
    const comResponsavel = { ...base, responsavelNome: "Marta Lima", responsavelCpf: "222" };
    expect(validarPaciente(comResponsavel, hoje)).toMatchObject({
      ok: true,
      valor: { responsavel: null },
    });
    expect(
      validarPaciente({ ...comResponsavel, dataNascimento: "1990-05-10" }, hoje),
    ).toMatchObject({ ok: true, valor: { responsavel: null } });
  });

  it("completa 18 anos no aniversário: um dia antes ainda é menor", () => {
    const menor = { ...base, dataNascimento: "2008-10-26" };
    expect(validarPaciente(menor, hoje)).toEqual({
      ok: false,
      mensagem: "Informe o nome do responsável",
    });
    expect(validarPaciente({ ...base, dataNascimento: "2008-10-25" }, hoje).ok).toBe(true);
  });
});

describe("ler canais", () => {
  it("descarta linha sem contato, canal desconhecido e item que não é objeto", () => {
    const json = JSON.stringify([
      { canal: "sms", contato: " 11 1 ", preferido: true },
      { canal: "fax", contato: "x", preferido: false },
      { canal: "email", contato: " ", preferido: false },
      "texto",
      null,
    ]);
    expect(lerCanais(json)).toEqual([{ canal: "sms", contato: "11 1", preferido: true }]);
  });

  it("JSON que não é lista vira lista vazia", () => {
    expect(lerCanais("{}")).toEqual([]);
    expect(lerCanais("")).toEqual([]);
  });
});
