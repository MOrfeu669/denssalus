import { describe, expect, it } from "vitest";
import { posicaoDoCartao } from "../../src/app/agenda/posicao";

const DENTISTAS = ["ana", "bruno"];
const DIAS = ["2026-11-09", "2026-11-10", "2026-11-11"];

describe("posição do cartão na grade", () => {
  it("no dia, o cartão cai na coluna do dentista e na faixa do horário", () => {
    expect(
      posicaoDoCartao(
        "dia",
        { inicio: "2026-11-12T09:30", fim: "2026-11-12T10:15", dentistaId: "bruno" },
        DENTISTAS,
        8,
      ),
    ).toEqual({ coluna: 1, topoMinutos: 90, alturaMinutos: 45 });
  });

  it("na semana, o cartão cai na coluna do dia e na faixa do horário", () => {
    expect(
      posicaoDoCartao(
        "semana",
        { inicio: "2026-11-11T14:00", fim: "2026-11-11T15:00", dentistaId: "ana" },
        DIAS,
        8,
      ),
    ).toEqual({ coluna: 2, topoMinutos: 360, alturaMinutos: 60 });
  });

  it("sem a coluna do dentista ou do dia, o cartão não entra na grade", () => {
    expect(
      posicaoDoCartao(
        "dia",
        { inicio: "2026-11-12T09:00", fim: "2026-11-12T10:00", dentistaId: "carla" },
        DENTISTAS,
        8,
      ),
    ).toBeNull();
  });
});
