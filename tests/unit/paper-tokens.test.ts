import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const raiz = resolve(__dirname, "../..");

/** Oráculo: contrato Paper do intent (WCAG 2.2 AA). */
const PAPER = {
  primary: "#111111",
  secondary: "#8B5CF6",
  surface: "#FFFFFF",
  text: "#111827",
  fundo: "#F9FAFB",
  tipografia: {
    sans: { loader: "Roboto", variavel: "--font-sans" },
    heading: { loader: "Montserrat", variavel: "--font-heading" },
    mono: { loader: "PT_Mono", variavel: "--font-mono" },
  },
} as const;

const CONTRASTE_AA_TEXTO = 4.5;

function propriedadesDoBloco(css: string, abertura: string): Map<string, string> {
  const inicio = css.indexOf(abertura);
  if (inicio < 0) return new Map();
  const corpoInicio = css.indexOf("{", inicio);
  let profundidade = 0;
  let fim = corpoInicio;
  for (; fim < css.length; fim += 1) {
    if (css[fim] === "{") profundidade += 1;
    else if (css[fim] === "}") {
      profundidade -= 1;
      if (profundidade === 0) break;
    }
  }
  const corpo = css.slice(corpoInicio + 1, fim);
  const mapa = new Map<string, string>();
  for (const match of corpo.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    mapa.set(match[1], match[2].trim());
  }
  return mapa;
}

function temaConsumivel(css: string): Map<string, string> {
  const raiz = propriedadesDoBloco(css, ":root");
  const tema = propriedadesDoBloco(css, "@theme inline");
  return new Map([...raiz, ...tema]);
}

function resolver(mapa: Map<string, string>, nome: string, vistos = new Set<string>()): string {
  const bruto = mapa.get(nome);
  if (bruto === undefined) throw new Error(`token ausente: ${nome}`);
  const ref = /^var\((--[\w-]+)\)$/.exec(bruto);
  if (!ref) return bruto;
  if (vistos.has(ref[1])) throw new Error(`ciclo em ${nome}`);
  vistos.add(ref[1]);
  return resolver(mapa, ref[1], vistos);
}

function hexNormalizado(valor: string): string {
  const hex = valor.trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) throw new Error(`esperado hex, veio ${valor}`);
  return hex.toUpperCase();
}

function canalLinear(canal: number): number {
  const c = canal / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = canalLinear((n >> 16) & 255);
  const g = canalLinear((n >> 8) & 255);
  const b = canalLinear(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(frente: string, fundo: string): number {
  const a = luminancia(hexNormalizado(frente));
  const b = luminancia(hexNormalizado(fundo));
  const claro = Math.max(a, b);
  const escuro = Math.min(a, b);
  return (claro + 0.05) / (escuro + 0.05);
}

describe("tokens Paper no tema", () => {
  it("dado o tema consumível, quando resolve as cores Paper, então batem o oráculo do intent", () => {
    const css = readFileSync(resolve(raiz, "src/app/globals.css"), "utf8");
    const tema = temaConsumivel(css);

    expect(hexNormalizado(resolver(tema, "--paper-primary"))).toBe(PAPER.primary);
    expect(hexNormalizado(resolver(tema, "--paper-secondary"))).toBe(PAPER.secondary);
    expect(hexNormalizado(resolver(tema, "--paper-surface"))).toBe(PAPER.surface);
    expect(hexNormalizado(resolver(tema, "--paper-text"))).toBe(PAPER.text);
    expect(hexNormalizado(resolver(tema, "--primary"))).toBe(PAPER.primary);
    expect(hexNormalizado(resolver(tema, "--foreground"))).toBe(PAPER.text);
  });

  it("dado link e placeholder no tema, quando medidos sobre superfície/fundo, então passam WCAG AA de texto", () => {
    const css = readFileSync(resolve(raiz, "src/app/globals.css"), "utf8");
    const tema = temaConsumivel(css);
    const link = hexNormalizado(resolver(tema, "--color-link"));
    const placeholder = hexNormalizado(resolver(tema, "--color-placeholder"));
    const fundos = [PAPER.surface, PAPER.fundo];

    expect(hexNormalizado(resolver(tema, "--paper-secondary"))).toBe(PAPER.secondary);
    expect(link).not.toBe(PAPER.secondary);

    for (const fundo of fundos) {
      expect(contraste(link, fundo)).toBeGreaterThanOrEqual(CONTRASTE_AA_TEXTO);
      expect(contraste(placeholder, fundo)).toBeGreaterThanOrEqual(CONTRASTE_AA_TEXTO);
    }
  });
});

describe("tipografia Paper na casca", () => {
  const carregadores = {
    Roboto: vi.fn((opts: { variable: string; className?: string }) => ({
      className: "roboto",
      variable: opts.variable,
    })),
    Montserrat: vi.fn((opts: { variable: string }) => ({
      className: "montserrat",
      variable: opts.variable,
    })),
    PT_Mono: vi.fn((opts: { variable: string }) => ({
      className: "pt-mono",
      variable: opts.variable,
    })),
  };

  beforeEach(() => {
    vi.resetModules();
    carregadores.Roboto.mockClear();
    carregadores.Montserrat.mockClear();
    carregadores.PT_Mono.mockClear();
    vi.doMock("next/font/google", () => carregadores);
  });

  it("dado o módulo de tipografia, quando a casca carrega fontes, então usa Roboto/Montserrat/PT Mono nos slots Paper", async () => {
    const { tipografiaCasca } = await import("../../src/app/tipografia-paper");

    expect(carregadores.Roboto).toHaveBeenCalledTimes(1);
    expect(carregadores.Montserrat).toHaveBeenCalledTimes(1);
    expect(carregadores.PT_Mono).toHaveBeenCalledTimes(1);
    expect(carregadores.Roboto.mock.calls[0][0].variable).toBe(PAPER.tipografia.sans.variavel);
    expect(carregadores.Montserrat.mock.calls[0][0].variable).toBe(PAPER.tipografia.heading.variavel);
    expect(carregadores.PT_Mono.mock.calls[0][0].variable).toBe(PAPER.tipografia.mono.variavel);
    expect(tipografiaCasca).toContain(PAPER.tipografia.sans.variavel);
    expect(tipografiaCasca).toContain(PAPER.tipografia.heading.variavel);
    expect(tipografiaCasca).toContain(PAPER.tipografia.mono.variavel);
  });
});
