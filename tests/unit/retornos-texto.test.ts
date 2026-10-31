import { describe, expect, it } from "vitest";
import {
  TEXTO_MARCAR,
  VAZIO_RETORNOS,
  dataLegivel,
  hrefReagendar,
  textoPrazo,
  textoPrevisto,
} from "../../src/app/retornos/texto";

describe("textos da tela Retornos", () => {
  it("dado nenhum retorno, então a lista diz que não há retorno pendente", () => {
    expect(VAZIO_RETORNOS).toBe("Nenhum retorno pendente.");
  });

  it("dada a região de marcar, então o texto manda marcar no agendamento", () => {
    expect(TEXTO_MARCAR).toBe("O retorno se marca no agendamento concluído.");
  });

  it("dado o prazo, então o aviso concorda com o número de dias", () => {
    expect(textoPrazo(1)).toBe("O aviso para reagendar aparece 1 dia antes da data prevista.");
    expect(textoPrazo(7)).toBe("O aviso para reagendar aparece 7 dias antes da data prevista.");
  });

  it("dada a data prevista, então o item mostra dia/mês/ano", () => {
    expect(dataLegivel("2026-11-07")).toBe("07/11/2026");
    expect(dataLegivel("sem data")).toBe("sem data");
    expect(textoPrevisto("2026-11-07")).toBe("Retorno previsto para 07/11/2026");
  });

  it("dado o id do paciente, então o link abre o agendamento com ele; sem id, sem query", () => {
    expect(hrefReagendar("p 1")).toBe("/agendamentos?paciente=p%201");
    expect(hrefReagendar()).toBe("/agendamentos");
  });
});
