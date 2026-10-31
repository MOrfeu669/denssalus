import { describe, expect, it } from "vitest";
import {
  horarioDoDia,
  intervaloLegivel,
  PENDENTE_BLOQUEAR,
  PENDENTE_CRIAR,
  PENDENTE_EMERGENCIA,
  PENDENTE_INICIAR,
  ROTULO_BLOQUEAR,
  ROTULO_CRIAR,
  ROTULO_EMERGENCIA,
  ROTULO_INICIAR,
  TEXTO_GRADE_ATUALIZA,
  rotuloDoBotao,
  vazioDaGrade,
} from "../../src/app/agendamentos/texto";

describe("textos das telas Agendamentos e Agenda", () => {
  it("dado criar sem ação em curso, quando o botão aparece, então diz Criar agendamento", () => {
    expect(rotuloDoBotao(ROTULO_CRIAR, PENDENTE_CRIAR, false)).toBe("Criar agendamento");
  });

  it("dado criar em curso, quando o botão aparece, então mostra o gerúndio", () => {
    expect(rotuloDoBotao(ROTULO_CRIAR, PENDENTE_CRIAR, true)).toBe("Criando…");
  });

  it("dado o bloqueio, quando o botão aparece, então diz Bloquear e, pendente, Bloqueando…", () => {
    expect(rotuloDoBotao(ROTULO_BLOQUEAR, PENDENTE_BLOQUEAR, false)).toBe("Bloquear");
    expect(rotuloDoBotao(ROTULO_BLOQUEAR, PENDENTE_BLOQUEAR, true)).toBe("Bloqueando…");
  });

  it("dado a emergência e o início, quando o botão aparece, então usa o rótulo do frame", () => {
    expect(rotuloDoBotao(ROTULO_EMERGENCIA, PENDENTE_EMERGENCIA, false)).toBe("Registrar emergência");
    expect(rotuloDoBotao(ROTULO_EMERGENCIA, PENDENTE_EMERGENCIA, true)).toBe("Registrando…");
    expect(rotuloDoBotao(ROTULO_INICIAR, PENDENTE_INICIAR, false)).toBe("Iniciar");
    expect(rotuloDoBotao(ROTULO_INICIAR, PENDENTE_INICIAR, true)).toBe("Iniciando…");
  });

  it("dado a grade, então o texto avisa que ela acompanha horários novos", () => {
    expect(TEXTO_GRADE_ATUALIZA).toBe("A grade atualiza quando outra pessoa cria um horário.");
  });

  it("dado a grade sem horários, quando a visão é dia, então o texto diz que o dia está vazio", () => {
    expect(vazioDaGrade("dia")).toBe("Nenhum horário neste dia.");
  });

  it("dado a grade sem horários, quando a visão é semana, então o texto diz que a semana está vazia", () => {
    expect(vazioDaGrade("semana")).toBe("Nenhum horário nesta semana.");
  });

  it("dado início e fim no mesmo dia, quando a lista mostra o intervalo, então junta data e horas", () => {
    expect(intervaloLegivel("2026-10-31T09:00", "2026-10-31T10:30")).toBe(
      "31/10/2026 09:00–10:30",
    );
  });

  it("dado início e fim em dias diferentes, quando a lista mostra o intervalo, então mostra os dois dias", () => {
    expect(intervaloLegivel("2026-10-31T23:00", "2026-11-01T01:00")).toBe(
      "31/10/2026 23:00 – 01/11/2026 01:00",
    );
  });

  it("dado texto fora do padrão, quando a lista mostra o intervalo, então não inventa formato", () => {
    expect(intervaloLegivel("amanhã", "depois")).toBe("amanhã–depois");
  });

  it("dado um bloqueio no mesmo dia, quando a grade mostra o horário, então só as horas", () => {
    expect(horarioDoDia("2026-10-31T14:00:00", "2026-10-31T15:00:00")).toBe("14:00–15:00");
  });
});
