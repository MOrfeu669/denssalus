import { beforeEach, describe, expect, it } from "vitest";
import { MENSAGEM_PAPEL } from "../../src/domain/auth/tipos";
import { listarModelos, salvarModelo } from "../../src/domain/mensagem/casos";
import { TEXTOS_PADRAO } from "../../src/domain/mensagem/regras";
import { MENSAGEM_CONTEUDO_VAZIO, TIPOS_MENSAGEM } from "../../src/domain/mensagem/tipos";
import { CLINICA, Memoria, OUTRA, sessao } from "./apoio-mensagem";

describe("modelo de mensagem", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
  });

  it.each([
    ["dentista", true],
    ["recepcionista", true],
    ["admin", false],
  ] as const)(
    "dado papel %s ativo %s, quando lista modelos, então a ação não é permitida",
    async (papel, ativo) => {
      const resultado = await listarModelos(memoria.deps(), sessao(papel, ativo));
      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
      expect(memoria.modelos).toEqual([]);
    },
  );

  it.each([
    ["dentista", true],
    ["recepcionista", true],
    ["admin", false],
  ] as const)(
    "dado papel %s ativo %s, quando salva modelo, então a ação não é permitida e nada é gravado",
    async (papel, ativo) => {
      const resultado = await salvarModelo(memoria.deps(), sessao(papel, ativo), {
        tipo: "lembrete_24h",
        conteudo: "Não esqueça",
      });
      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_PAPEL });
      expect(memoria.modelos).toEqual([]);
    },
  );

  it.each(["", "   "])(
    "dado conteúdo %j, quando o admin salva o modelo, então falha e não grava",
    async (conteudo) => {
      const resultado = await salvarModelo(memoria.deps(), sessao("admin"), {
        tipo: "confirmacao_agendamento",
        conteudo,
      });
      expect(resultado).toEqual({ ok: false, mensagem: MENSAGEM_CONTEUDO_VAZIO });
      expect(MENSAGEM_CONTEUDO_VAZIO).toBe("Informe o conteúdo da mensagem");
      expect(memoria.modelos).toEqual([]);
    },
  );

  it("dado nenhum modelo salvo, quando o admin lista, então devolve os três textos padrão sem gravar", async () => {
    const resultado = await listarModelos(memoria.deps(), sessao("admin"));

    expect(resultado).toEqual({
      ok: true,
      valor: TIPOS_MENSAGEM.map((tipo) => ({
        clinicaId: CLINICA,
        tipo,
        conteudo: TEXTOS_PADRAO[tipo],
      })),
    });
    expect(memoria.modelos).toEqual([]);
  });

  it("dado um admin, quando salva o modelo, então grava só a clínica dele e a outra clínica fica no padrão", async () => {
    const resultado = await salvarModelo(memoria.deps(), sessao("admin"), {
      tipo: "lembrete_24h",
      conteudo: "  Não esqueça a consulta  ",
    });

    expect(resultado).toEqual({
      ok: true,
      valor: { clinicaId: CLINICA, tipo: "lembrete_24h", conteudo: "Não esqueça a consulta" },
    });
    const outra = await listarModelos(memoria.deps(), sessao("admin", true, OUTRA));
    expect(outra.ok).toBe(true);
    if (!outra.ok) return;
    expect(outra.valor.find((item) => item.tipo === "lembrete_24h")?.conteudo).toBe(
      TEXTOS_PADRAO.lembrete_24h,
    );
    expect(outra.valor.every((item) => item.clinicaId === OUTRA)).toBe(true);
    expect(memoria.modelos).toEqual([
      { clinicaId: CLINICA, tipo: "lembrete_24h", conteudo: "Não esqueça a consulta" },
    ]);
  });
});
