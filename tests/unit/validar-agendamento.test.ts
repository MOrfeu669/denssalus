import { describe, expect, it } from "vitest";
import { validarAgendamento, validarBloqueio } from "../../src/app/agendamentos/validar";

const base = {
  pacienteId: " pac-1 ",
  dentistaId: " den-1 ",
  cadeiraId: " cad-1 ",
  procedimentoId: " ",
  inicio: "2026-10-26T14:00",
  fim: "2026-10-26T14:30",
};

const bloqueio = {
  dentistaId: " den-1 ",
  inicio: "2026-10-26T14:00",
  fim: "2026-10-26T15:00",
  motivo: " ",
};

describe("validar agendamento", () => {
  it("aceita paciente, dentista, cadeira e intervalo, e procedimento vazio vira null", () => {
    expect(validarAgendamento(base)).toEqual({
      ok: true,
      valor: {
        pacienteId: "pac-1",
        dentistaId: "den-1",
        cadeiraId: "cad-1",
        procedimentoId: null,
        inicio: "2026-10-26T14:00",
        fim: "2026-10-26T14:30",
      },
    });
  });

  it("guarda o procedimento informado, já sem espaços", () => {
    expect(validarAgendamento({ ...base, procedimentoId: " proc-1 " })).toMatchObject({
      ok: true,
      valor: { procedimentoId: "proc-1" },
    });
  });

  it("recusa paciente em branco", () => {
    expect(validarAgendamento({ ...base, pacienteId: "  " })).toEqual({
      ok: false,
      mensagem: "Informe o paciente",
    });
  });

  it("recusa dentista em branco", () => {
    expect(validarAgendamento({ ...base, dentistaId: "" })).toEqual({
      ok: false,
      mensagem: "Informe o dentista",
    });
  });

  it("recusa cadeira em branco", () => {
    expect(validarAgendamento({ ...base, cadeiraId: " " })).toEqual({
      ok: false,
      mensagem: "Informe a cadeira",
    });
  });

  it("pede o paciente antes de reclamar do horário", () => {
    expect(validarAgendamento({ ...base, pacienteId: "", inicio: "" })).toEqual({
      ok: false,
      mensagem: "Informe o paciente",
    });
  });

  it("recusa início vazio, fim vazio, fim igual ou anterior ao início e data inexistente", () => {
    const mensagem = "Informe um horário válido";
    expect(validarAgendamento({ ...base, inicio: "" })).toEqual({ ok: false, mensagem });
    expect(validarAgendamento({ ...base, fim: " " })).toEqual({ ok: false, mensagem });
    expect(validarAgendamento({ ...base, fim: "2026-10-26T14:00" })).toEqual({ ok: false, mensagem });
    expect(validarAgendamento({ ...base, fim: "2026-10-26T14:00:00" })).toEqual({
      ok: false,
      mensagem,
    });
    expect(
      validarAgendamento({ ...base, inicio: "2026-10-26T15:00", fim: "2026-10-26T14:30" }),
    ).toEqual({ ok: false, mensagem });
    expect(validarAgendamento({ ...base, inicio: "26/10/2026 14:00" })).toEqual({
      ok: false,
      mensagem,
    });
    expect(validarAgendamento({ ...base, inicio: "2026-02-31T10:00" })).toEqual({
      ok: false,
      mensagem,
    });
  });

  it("aceita o fim um segundo depois e não aplica o horário da clínica", () => {
    expect(
      validarAgendamento({ ...base, fim: "2026-10-26T14:00:01" }),
    ).toMatchObject({ ok: true, valor: { fim: "2026-10-26T14:00:01" } });
    expect(
      validarAgendamento({ ...base, inicio: "2026-10-26T19:00", fim: "2026-10-26T19:45" }).ok,
    ).toBe(true);
  });
});

describe("validar bloqueio", () => {
  it("aceita dentista e horário, e motivo vazio vira null", () => {
    expect(validarBloqueio(bloqueio)).toEqual({
      ok: true,
      valor: {
        dentistaId: "den-1",
        inicio: "2026-10-26T14:00",
        fim: "2026-10-26T15:00",
        motivo: null,
      },
    });
  });

  it("guarda o motivo informado, já sem espaços", () => {
    expect(validarBloqueio({ ...bloqueio, motivo: " Congresso " })).toMatchObject({
      ok: true,
      valor: { motivo: "Congresso" },
    });
  });

  it("recusa dentista em branco", () => {
    expect(validarBloqueio({ ...bloqueio, dentistaId: "  " })).toEqual({
      ok: false,
      mensagem: "Informe o dentista",
    });
  });

  it("pede o dentista antes de reclamar do horário", () => {
    expect(validarBloqueio({ ...bloqueio, dentistaId: "", inicio: "", fim: "" })).toEqual({
      ok: false,
      mensagem: "Informe o dentista",
    });
  });

  it("recusa horário vazio, igual ou invertido", () => {
    const mensagem = "Informe um horário válido";
    expect(validarBloqueio({ ...bloqueio, inicio: " " })).toEqual({ ok: false, mensagem });
    expect(validarBloqueio({ ...bloqueio, fim: bloqueio.inicio })).toEqual({ ok: false, mensagem });
    expect(
      validarBloqueio({ ...bloqueio, inicio: "2026-10-26T18:00", fim: "2026-10-26T17:00" }),
    ).toEqual({ ok: false, mensagem });
  });
});
