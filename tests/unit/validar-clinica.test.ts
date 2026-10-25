import { describe, expect, it } from "vitest";
import { validarCriacao, validarFuncionamento } from "../../src/app/clinica/validar";

const base = {
  nome: " Clínica OdontoSmile ",
  dias: ["segunda", "terca", "quarta", "quinta", "sexta"],
  abertura: "08:00",
  fechamento: "18:00",
  cadeiras: "3",
};

describe("validar criação da clínica", () => {
  it("aceita nome, dias, horário sugerido e 3 cadeiras", () => {
    expect(validarCriacao(base)).toEqual({
      ok: true,
      valor: {
        nome: "Clínica OdontoSmile",
        diasAtendimento: ["segunda", "terca", "quarta", "quinta", "sexta"],
        horarioAbertura: "08:00",
        horarioFechamento: "18:00",
        cadeiras: 3,
      },
    });
  });

  it("recusa nome em branco", () => {
    expect(validarCriacao({ ...base, nome: "   " })).toEqual({
      ok: false,
      mensagem: "Informe o nome",
    });
  });

  it("recusa quando nenhum dia é selecionado", () => {
    expect(validarCriacao({ ...base, dias: [] })).toEqual({
      ok: false,
      mensagem: "Informe ao menos um dia",
    });
  });

  it("recusa horário que não seja HH:MM", () => {
    for (const abertura of ["", "8:00", "25:00", "08:60", "abc"]) {
      expect(validarCriacao({ ...base, abertura })).toEqual({
        ok: false,
        mensagem: "Informe um horário válido",
      });
    }
  });

  it("recusa abertura igual ou depois do fechamento", () => {
    const mensagem = "A abertura precisa ser antes do fechamento";
    expect(validarCriacao({ ...base, abertura: "18:00" })).toEqual({ ok: false, mensagem });
    expect(validarCriacao({ ...base, abertura: "19:00" })).toEqual({ ok: false, mensagem });
  });

  it("recusa quantidade de cadeiras vazia, zero, negativa ou fracionária", () => {
    for (const cadeiras of ["", "0", "-1", "1.5", "abc"]) {
      expect(validarCriacao({ ...base, cadeiras })).toEqual({
        ok: false,
        mensagem: "Informe ao menos uma cadeira",
      });
    }
  });
});

describe("validar funcionamento da clínica", () => {
  it("aceita segunda a sábado e devolve os dias na ordem da semana", () => {
    const resultado = validarFuncionamento({
      dias: ["sabado", "segunda", "terca", "quarta", "quinta", "sexta", "sabado", "feriado"],
      abertura: "08:00",
      fechamento: "17:00",
    });

    expect(resultado).toEqual({
      ok: true,
      valor: {
        diasAtendimento: ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"],
        horarioAbertura: "08:00",
        horarioFechamento: "17:00",
      },
    });
  });

  it("ignora valor que não seja dia da semana e recusa se nada sobra", () => {
    expect(
      validarFuncionamento({ dias: ["feriado"], abertura: "08:00", fechamento: "18:00" }),
    ).toEqual({ ok: false, mensagem: "Informe ao menos um dia" });
  });
});
