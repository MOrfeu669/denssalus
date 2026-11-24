import { describe, expect, it } from "vitest";
import {
  almocoVisivel,
  trilhosNaColuna,
  colunasDoDia,
  contarDia,
  diasDoMes,
  iniciais,
  percentualOcupacao,
  pixelsPorMinuto,
  resumoDia,
  resumoSemana,
  rotuloDiaLongo,
  rotuloIntervalo,
  semanaIso,
} from "../../src/app/agenda/apresentacao";

describe("textos da agenda", () => {
  it("dado 23 consultas e 2 em espera, quando resume o dia, então lê a frase do desenho", () => {
    expect(resumoDia(23, 2)).toBe("23 consultas hoje · 2 pacientes na sala de espera");
  });

  it("dado um único horário, quando resume o dia, então usa o singular", () => {
    expect(resumoDia(1, 1)).toBe("1 consulta hoje · 1 paciente na sala de espera");
  });

  it("dado a semana 48 com 96 consultas e 82% , quando resume, então junta os três números", () => {
    expect(resumoSemana(48, 96, 82)).toBe("Semana 48 · 96 consultas · ocupação 82%");
  });

  it("dado ocupação indefinida, quando resume a semana, então não inventa percentual", () => {
    expect(resumoSemana(48, 0, null)).toBe("Semana 48 · 0 consultas");
  });

  it("dado 24 de novembro de 2026, quando rotula o dia, então escreve Terça, 24 de novembro", () => {
    expect(rotuloDiaLongo("2026-11-24")).toBe("Terça, 24 de novembro");
    expect(semanaIso("2026-11-24")).toBe(48);
  });

  it("dado a semana de 23 a 29 de novembro, quando rotula o intervalo, então cabe no mesmo mês", () => {
    expect(rotuloIntervalo("2026-11-23", "2026-11-29")).toBe("23 – 29 de novembro de 2026");
  });
});

describe("colunas do dia", () => {
  const dentistas = [
    { id: "ml", nome: "Dra. Mariana Lopes" },
    { id: "rc", nome: "Dr. Rafael Couto" },
  ];

  it("dado dois horários do mesmo dentista em cadeiras diferentes, quando monta a coluna, então o dentista aparece uma vez com as duas cadeiras", () => {
    const colunas = colunasDoDia({
      dentistaId: null,
      dentistas,
      presentes: [],
      agendamentos: [
        { dentistaId: "ml", cadeiraId: "c1" },
        { dentistaId: "ml", cadeiraId: "c2" },
      ],
      nomesDentistas: {},
      nomesCadeiras: { c1: "Cadeira 1", c2: "Cadeira 2" },
      cadeiraId: null,
      nomeCadeiraFiltrada: null,
    });

    expect(colunas.map((coluna) => coluna.nome)).toEqual(["Dra. Mariana Lopes", "Dr. Rafael Couto"]);
    expect(colunas[0]).toMatchObject({ subtitulo: "Cadeira 1 · Cadeira 2", cadeiraId: "" });
    expect(iniciais("Dra. Mariana Lopes")).toBe("ML");
    expect(iniciais("Dr. Rafael Couto")).toBe("RC");
  });

  it("dado um filtro de dentista, quando monta a coluna, então os outros dentistas ficam de fora", () => {
    const colunas = colunasDoDia({
      dentistaId: "rc",
      dentistas,
      presentes: [{ dentistaId: "ml" }],
      agendamentos: [{ dentistaId: "rc", cadeiraId: "c2" }],
      nomesDentistas: {},
      nomesCadeiras: { c2: "Cadeira 2" },
      cadeiraId: null,
      nomeCadeiraFiltrada: null,
    });

    expect(colunas).toEqual([
      { id: "rc", nome: "Dr. Rafael Couto", subtitulo: "Cadeira 2", cadeiraId: "c2" },
    ]);
  });
});

describe("calendário e ocupação", () => {
  it("dado novembro de 2026, quando lista os dias, então o dia 1 cai num domingo", () => {
    const dias = diasDoMes(2026, 11);
    expect(dias[0]).toMatchObject({ dia: 1, domingo: true, iso: "2026-11-01" });
    expect(dias).toHaveLength(30);
  });

  it("dado expediente das 8 às 18, quando mede o almoço, então a faixa das 12 às 13 aparece", () => {
    expect(almocoVisivel("08:00", "18:00")).toBe(true);
    expect(almocoVisivel("14:00", "20:00")).toBe(false);
  });

  it("dado 3 dentistas em 7 dias de 10 horas e 600 minutos ocupados, quando calcula a ocupação, então arredonda para 5%", () => {
    expect(
      percentualOcupacao({
        minutosOcupados: 600,
        dentistas: 3,
        abertura: "08:00",
        fechamento: "18:00",
        dias: 7,
      }),
    ).toBe(5);
  });

  it("dado a visão do dia, quando converte minuto em pixel, então a hora mede 64 pixels", () => {
    expect(pixelsPorMinuto("dia")).toBeCloseTo(64 / 60);
    expect(pixelsPorMinuto("semana")).toBe(1);
  });

  it("dado dois horários que se cruzam, quando distribui os trilhos, então cada um fica numa faixa", () => {
    const trilhos = trilhosNaColuna([
      { id: "a", inicio: 0, fim: 60 },
      { id: "b", inicio: 30, fim: 90 },
      { id: "c", inicio: 60, fim: 120 },
    ]);
    expect(trilhos.total).toBe(2);
    expect(trilhos.faixa.get("a")).toBe(0);
    expect(trilhos.faixa.get("b")).toBe(1);
    expect(trilhos.faixa.get("c")).toBe(0);
  });

  it("dado um cancelado e um em espera, quando conta o dia, então o cancelado não entra nas consultas", () => {
    expect(contarDia([{ status: "cancelado" }, { status: "em_espera" }, { status: "agendado" }])).toEqual({
      consultas: 2,
      espera: 1,
    });
  });
});
