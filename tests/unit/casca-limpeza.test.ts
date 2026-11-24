import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const raiz = resolve(__dirname, "../..");
const ler = (caminho: string) => readFileSync(resolve(raiz, caminho), "utf8");

function bloco(css: string, abertura: string): string {
  const inicio = css.indexOf(abertura);
  if (inicio < 0) return "";
  const corpo = css.indexOf("{", inicio);
  let profundidade = 0;
  let fim = corpo;
  for (; fim < css.length; fim += 1) {
    if (css[fim] === "{") profundidade += 1;
    else if (css[fim] === "}") {
      profundidade -= 1;
      if (profundidade === 0) break;
    }
  }
  return css.slice(inicio, fim + 1);
}

describe("limpeza de CSS da casca", () => {
  it("dado o globals, quando lê os tokens, então marca, ação, névoa e a lateral #111 saíram e o login teal permanece na tela", () => {
    const css = ler("src/app/globals.css");
    const login = ler("src/app/login/page.tsx");

    expect(css).not.toMatch(/--cor-marca\s*:/);
    expect(css).not.toMatch(/--cor-acao\s*:/);
    expect(css).not.toMatch(/--color-marca\s*:/);
    expect(css).not.toMatch(/--color-acao\s*:/);
    expect(css).not.toMatch(/--color-nevoa\s*:/);
    expect(css).not.toMatch(/--sidebar\s*:\s*#111111/);
    expect(css).not.toMatch(/--color-sidebar\s*:/);
    expect(login).toContain("--cor-login-marca:#0f433d");
    expect(login).toContain("--cor-login-acao:#158172");
    expect(login).toContain("--cor-login-nevoa:#d3f3ec");
  });

  it("dado a casca, quando procura classes mortas, então dente, prontuário e nota não estão mais nela", () => {
    const css = ler("src/app/casca.css");

    expect(css).not.toMatch(/\.dente\b/);
    expect(css).not.toMatch(/\.prontuario-/);
    expect(css).not.toMatch(/\.casca-nota\b/);
    expect(css).not.toMatch(/\.acao\b/);
    expect(ler("src/app/prontuarios/[pacienteId]/tela.css")).toMatch(/\.dente\b/);
    expect(ler("src/app/prontuarios/[pacienteId]/odontograma.tsx")).toContain('className={comRegistro.has(dente) ? "dente com-registro" : "dente"}');
  });

  it("dado o miolo, quando estiliza campo e botão, então a regra está no layer base e o laboratório não usa importante", () => {
    const css = ler("src/app/globals.css");
    const base = bloco(css, "@layer base");
    const laboratorio = ler("src/app/laboratorios/form.tsx");

    expect(base).toContain(".casca .casca-miolo form");
    expect(base).toContain(".casca .casca-miolo input");
    expect(base).toContain(".casca .casca-miolo button");
    expect(ler("src/app/casca.css")).not.toContain(".casca .casca-miolo input");
    expect(laboratorio).not.toMatch(/[a-z0-9)-]!\b/);
    expect(ler("src/app/agenda/barra.tsx")).not.toMatch(/[a-z0-9)-]!\b/);
  });
});
