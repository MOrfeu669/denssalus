import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const raiz = resolve(__dirname, "../..");

describe("tokens Paper no tema", () => {
  it("dado o globals, quando o tema carrega, então as cores Paper estão nos tokens semânticos", () => {
    const css = readFileSync(resolve(raiz, "src/app/globals.css"), "utf8");

    expect(css).toContain("--primary: #111111");
    expect(css).toContain("--paper-secondary: #8B5CF6");
    expect(css).toContain("--paper-surface: #FFFFFF");
    expect(css).toContain("--paper-text: #111827");
    expect(css).toContain("--foreground: var(--paper-text)");
    expect(css).toContain("--font-sans:");
    expect(css).toContain("--font-heading:");
    expect(css).toContain("--font-mono:");
  });

  it("dado a casca, quando o shell renderiza tipografia, então usa Roboto, Montserrat e PT Mono", () => {
    const fonte = readFileSync(resolve(raiz, "src/app/casca.tsx"), "utf8");

    expect(fonte).toContain('from "next/font/google"');
    expect(fonte).toMatch(/Roboto/);
    expect(fonte).toMatch(/Montserrat/);
    expect(fonte).toMatch(/PT_Mono|PT Mono/);
  });
});
