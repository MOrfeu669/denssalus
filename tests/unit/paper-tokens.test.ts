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
  warning: "#D97706",
  fundo: "#EFEFE4",
  tipografia: {
    sans: { loader: "Roboto", variavel: "--font-sans" },
    heading: { loader: "Montserrat", variavel: "--font-heading" },
    mono: { loader: "PT_Mono", variavel: "--font-mono" },
  },
} as const;

const CONTRASTE_AA_TEXTO = 4.5;
const CONTRASTE_AA_COMPONENTE = 3;

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
    expect(hexNormalizado(resolver(tema, "--paper-warning"))).toBe(PAPER.warning);
    expect(hexNormalizado(resolver(tema, "--color-aviso"))).toBe(PAPER.warning);
  });

  it("dado o fundo de papel, quando resolve o miolo, então fundo e background usam o papel quente", () => {
    const css = readFileSync(resolve(raiz, "src/app/globals.css"), "utf8");
    const tema = temaConsumivel(css);

    expect(hexNormalizado(resolver(tema, "--paper-fundo"))).toBe(PAPER.fundo);
    expect(hexNormalizado(resolver(tema, "--cor-fundo"))).toBe(PAPER.fundo);
    expect(hexNormalizado(resolver(tema, "--background"))).toBe(PAPER.fundo);
    expect(hexNormalizado(resolver(tema, "--color-fundo"))).toBe(PAPER.fundo);
  });

  it("dado raios, sombras, overlay, disabled e lateral, quando lê o tema, então os tokens existem", () => {
    const css = readFileSync(resolve(raiz, "src/app/globals.css"), "utf8");
    const tema = temaConsumivel(css);

    expect(resolver(tema, "--radius-paper-sm")).toBe("4px");
    expect(resolver(tema, "--radius-paper-md")).toBe("8px");
    for (const nome of [
      "--shadow-paper-sm",
      "--shadow-paper-md",
      "--shadow-paper-overlay",
      "--color-overlay",
      "--color-desabilitado",
      "--color-desabilitado-tinta",
      "--paper-disabled-opacidade",
      "--color-lateral",
      "--color-lateral-tinta",
      "--color-lateral-ativo",
      "--color-lateral-borda",
      "--color-borda-papel",
    ]) {
      expect(resolver(tema, nome)).not.toBe("");
    }
    expect(hexNormalizado(resolver(tema, "--color-lateral"))).toBe(PAPER.surface);
    expect(hexNormalizado(resolver(tema, "--paper-borda"))).toBe("#E2E2D1");
    expect(resolver(tema, "--paper-lateral-largura")).toBe("248px");
    expect(resolver(tema, "--radius-controle")).toBe("6px");
  });

  it("dado o status do agendamento e as tintas, quando o tema resolve, então as cores batem o desenho", () => {
    const css = readFileSync(resolve(raiz, "src/app/globals.css"), "utf8");
    const tema = temaConsumivel(css);
    const pares: Record<string, string> = {
      "--color-paper-status-agendado": "#8B5CF6",
      "--color-paper-status-agendado-fundo": "#EDE9FE",
      "--color-paper-status-agendado-tinta": "#5B21B6",
      "--color-paper-status-em-espera": "#D97706",
      "--color-paper-status-em-espera-fundo": "#FEF3C7",
      "--color-paper-status-em-espera-tinta": "#92400E",
      "--color-paper-status-iniciado": "#111111",
      "--color-paper-status-iniciado-fundo": "#111111",
      "--color-paper-status-iniciado-tinta": "#FFFFFF",
      "--color-paper-status-concluido": "#16A34A",
      "--color-paper-status-concluido-fundo": "#DCFCE7",
      "--color-paper-status-concluido-tinta": "#166534",
      "--color-paper-status-cancelado": "#8A887A",
      "--color-paper-status-cancelado-fundo": "#FFFFFF",
      "--color-paper-status-cancelado-tinta": "#4B4A42",
      "--color-paper-tint-neutral": "#F1F1EA",
      "--color-paper-tint-purple": "#EDE9FE",
      "--color-paper-tint-success": "#DCFCE7",
      "--color-paper-tint-warning": "#FEF3C7",
      "--color-paper-tint-danger": "#FEE2E2",
      "--color-paper-tint-agendado": "#F5F3FF",
      "--color-paper-tint-em-espera": "#FFFBEB",
      "--color-paper-tint-concluido": "#F0FDF4",
      "--color-paper-ink-2": "#4B4A42",
      "--color-paper-subtle": "#F7F7F0",
      "--color-paper-marca": "#0F433D",
    };

    for (const [nome, hex] of Object.entries(pares)) {
      expect(hexNormalizado(resolver(tema, nome))).toBe(hex);
    }

    const contrastes: [string, string][] = [
      ["--color-paper-status-agendado-tinta", "--color-paper-status-agendado-fundo"],
      ["--color-paper-status-em-espera-tinta", "--color-paper-status-em-espera-fundo"],
      ["--color-paper-status-iniciado-tinta", "--color-paper-status-iniciado-fundo"],
      ["--color-paper-status-concluido-tinta", "--color-paper-status-concluido-fundo"],
      ["--color-paper-status-cancelado-tinta", "--color-paper-status-cancelado-fundo"],
    ];
    for (const [frente, fundo] of contrastes) {
      expect(contraste(hexNormalizado(resolver(tema, frente)), hexNormalizado(resolver(tema, fundo)))).toBeGreaterThanOrEqual(
        CONTRASTE_AA_TEXTO,
      );
    }
  });

  it("dado tintas de estado sobre os fundos de estado, então passam WCAG AA de texto", () => {
    const css = readFileSync(resolve(raiz, "src/app/globals.css"), "utf8");
    const tema = temaConsumivel(css);
    const pares: [string, string][] = [
      ["--color-perigo-tinta", "--color-perigo-fundo"],
      ["--color-ok-tinta", "--color-ok-fundo"],
      ["--color-aviso-tinta", "--color-aviso-fundo"],
    ];

    for (const [frente, fundo] of pares) {
      expect(
        contraste(hexNormalizado(resolver(tema, frente)), hexNormalizado(resolver(tema, fundo))),
      ).toBeGreaterThanOrEqual(CONTRASTE_AA_TEXTO);
    }
  });

  it("dada a borda de campo, quando medida sobre superfície e papel, então passa 3:1 de componente", () => {
    const css = readFileSync(resolve(raiz, "src/app/globals.css"), "utf8");
    const tema = temaConsumivel(css);

    for (const nome of ["--color-campo-borda", "--color-campo-borda-hover"]) {
      const borda = hexNormalizado(resolver(tema, nome));
      for (const fundo of [PAPER.surface, PAPER.fundo]) {
        expect(contraste(borda, fundo)).toBeGreaterThanOrEqual(CONTRASTE_AA_COMPONENTE);
      }
    }
  });

  it("dado link, placeholder e texto apagado no tema, quando medidos sobre superfície/fundo, então passam WCAG AA de texto", () => {
    const css = readFileSync(resolve(raiz, "src/app/globals.css"), "utf8");
    const tema = temaConsumivel(css);
    const link = hexNormalizado(resolver(tema, "--color-link"));
    const placeholder = hexNormalizado(resolver(tema, "--color-placeholder"));
    const apagado = hexNormalizado(resolver(tema, "--color-apagado"));
    const mutedForeground = hexNormalizado(resolver(tema, "--muted-foreground"));
    const fundos = [PAPER.surface, PAPER.fundo];

    expect(hexNormalizado(resolver(tema, "--paper-secondary"))).toBe(PAPER.secondary);
    expect(link).not.toBe(PAPER.secondary);

    for (const fundo of fundos) {
      expect(contraste(link, fundo)).toBeGreaterThanOrEqual(CONTRASTE_AA_TEXTO);
      expect(contraste(placeholder, fundo)).toBeGreaterThanOrEqual(CONTRASTE_AA_TEXTO);
      expect(contraste(apagado, fundo)).toBeGreaterThanOrEqual(CONTRASTE_AA_TEXTO);
      expect(contraste(mutedForeground, fundo)).toBeGreaterThanOrEqual(CONTRASTE_AA_TEXTO);
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
    await import("../../src/app/tipografia-paper");

    expect(carregadores.Roboto).toHaveBeenCalledTimes(1);
    expect(carregadores.Montserrat).toHaveBeenCalledTimes(1);
    expect(carregadores.PT_Mono).toHaveBeenCalledTimes(1);
    expect(carregadores.Roboto.mock.calls[0][0].variable).toBe(PAPER.tipografia.sans.variavel);
    expect(carregadores.Montserrat.mock.calls[0][0].variable).toBe(PAPER.tipografia.heading.variavel);
    expect(carregadores.PT_Mono.mock.calls[0][0].variable).toBe(PAPER.tipografia.mono.variavel);
  });
});
