// @vitest-environment happy-dom

import { createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { Badge, badgeVariants } from "../../src/components/ui/badge";
import { Button, buttonVariants } from "../../src/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Checkbox } from "../../src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../src/components/ui/dialog";
import { Input } from "../../src/components/ui/input";
import { Label } from "../../src/components/ui/label";
import { NativeSelect, NativeSelectOption } from "../../src/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../src/components/ui/table";
import { Textarea } from "../../src/components/ui/textarea";
import { cn } from "../../src/lib/utils";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

afterEach(async () => {
  for (const root of roots.splice(0)) {
    await act(async () => {
      root.unmount();
    });
  }
  document.body.innerHTML = "";
});

async function montar(node: ReactNode) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => {
    root.render(node);
  });
  return host;
}

function classesDe(html: string): string {
  const match = html.match(/class="([^"]*)"/);
  return match?.[1] ?? "";
}

function dialogoVisivel(): HTMLElement | null {
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
  if (!dialog || dialog.hasAttribute("hidden")) return null;
  if (!dialog.hasAttribute("data-open") && dialog.hasAttribute("data-closed")) return null;
  return dialog;
}

async function esperar(condicao: () => boolean) {
  const inicio = Date.now();
  while (Date.now() - inicio < 1200) {
    if (condicao()) return;
    await act(async () => {
      await new Promise((resolver) => setTimeout(resolver, 16));
    });
  }
}

const botaoEntrar =
  "h-12 w-full rounded-[10px] border-0 bg-(--cor-login-acao) text-base leading-6 font-semibold text-white shadow-none hover:bg-(--cor-login-marca) active:translate-y-0 disabled:border-0 disabled:bg-(--cor-login-acao) disabled:text-white disabled:opacity-100";

describe("botão Paper", () => {
  it("dado a variante padrão, quando o ponteiro paira, então o fundo usa --paper-primary-hover", () => {
    const classes = buttonVariants({ variant: "default" });
    expect(classes).toContain("hover:bg-(--paper-primary-hover)");
    expect(classes).not.toContain("hover:bg-primary/80");
    expect(classes).toContain("focus-visible:outline-destaque");
    expect(classes).toContain("disabled:bg-desabilitado");
    expect(classes).toContain("disabled:text-desabilitado-tinta");
    expect(classes).toContain("disabled:opacity-100");
    expect(classes).toContain("aria-invalid:border-perigo");
  });

  it("dado as seis variantes, quando cada uma é pedida, então a classe continua disponível", () => {
    const variantes = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const;
    for (const variant of variantes) {
      expect(buttonVariants({ variant }).length).toBeGreaterThan(0);
    }
    expect(buttonVariants({ variant: "outline" })).toContain("border-borda-papel");
    expect(buttonVariants({ variant: "secondary" })).toContain("bg-secondary");
    expect(buttonVariants({ variant: "ghost" })).toContain("hover:bg-papel");
    expect(buttonVariants({ variant: "destructive" })).toContain("bg-perigo-fundo");
    expect(buttonVariants({ variant: "link" })).toContain("text-link");
    expect(buttonVariants({ size: "icon" })).toContain("size-8");
    expect(buttonVariants({ size: "sm" })).toContain("h-7");
  });

  it("dado o botão de entrar, quando a tela cobre o hover, então a cor do login permanece", () => {
    const classes = cn(buttonVariants({ variant: "default" }), botaoEntrar);
    expect(classes).toContain("hover:bg-(--cor-login-marca)");
    expect(classes).not.toContain("hover:bg-(--paper-primary-hover)");
    expect(classes).toContain("disabled:opacity-100");
    expect(classes).not.toContain("disabled:opacity-50");
    expect(classes).not.toContain("disabled:bg-desabilitado");
    expect(classes).not.toContain("disabled:text-desabilitado-tinta");
    expect(classes).toContain("disabled:text-white");
    expect(classes).toContain("bg-(--cor-login-acao)");
    expect(classes).toContain("text-white");
    expect(classes).not.toContain("text-tinta");
  });

  it("dado o botão de sair da lateral clara, quando usa o contorno Paper, então o texto escuro permanece", () => {
    const classes = cn(buttonVariants({ variant: "outline" }), "h-10 w-full");
    const lista = classes.split(/\s+/);
    expect(lista).toContain("h-10");
    expect(lista).toContain("border-borda-papel");
    expect(lista).toContain("text-tinta");
    expect(lista).toContain("hover:bg-papel");
    expect(lista).not.toContain("text-white");
    expect(lista).not.toContain("hover:bg-sidebar-accent");
    expect(lista).not.toContain("bg-transparent");
  });

  it("dado o botão desabilitado ou inválido, quando ele renderiza, então o estado vai no elemento", () => {
    const html = renderToStaticMarkup(
      createElement(Button, { type: "submit", disabled: true, "aria-invalid": true }, "Salvar"),
    );
    expect(html).toContain('type="submit"');
    expect(html).toContain("disabled");
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("Salvar");
  });
});

describe("campos Paper", () => {
  it("dado o input, quando está em repouso, hover, foco, desabilitado ou erro, então as classes do token estão presentes", () => {
    const html = renderToStaticMarkup(
      createElement(Input, { name: "nome", disabled: true, "aria-invalid": true, placeholder: "Nome" }),
    );
    const classes = classesDe(html);
    expect(html).toContain('name="nome"');
    expect(html).toContain("disabled");
    expect(html).toContain('aria-invalid="true"');
    expect(classes).toContain("border-campo-borda");
    expect(classes).toContain("bg-campo");
    expect(classes).toContain("hover:border-campo-borda-hover");
    expect(classes).toContain("focus-visible:outline-destaque");
    expect(classes).toContain("disabled:bg-desabilitado");
    expect(classes).toContain("disabled:text-desabilitado-tinta");
    expect(classes).toContain("aria-invalid:border-perigo");
    expect(classes).toContain("rounded-paper-md");
  });

  it("dado a textarea, quando marca erro, então o campo nativo carrega o mesmo contrato", () => {
    const html = renderToStaticMarkup(
      createElement(Textarea, { name: "evolucao", "aria-invalid": true }),
    );
    expect(html).toContain("<textarea");
    expect(html).toContain('name="evolucao"');
    expect(html).toContain('aria-invalid="true"');
    expect(classesDe(html)).toContain("aria-invalid:border-perigo");
    expect(classesDe(html)).toContain("focus-visible:outline-destaque");
    expect(classesDe(html)).toContain("disabled:bg-desabilitado");
  });

  it("dado o select nativo, quando o formulário envia, então é um select com name e sem listbox", () => {
    const html = renderToStaticMarkup(
      createElement(
        NativeSelect,
        { name: "cadeira", defaultValue: "1", "aria-invalid": true },
        createElement(NativeSelectOption, { value: "1" }, "Cadeira 1"),
      ),
    );
    expect(html).toContain("<select");
    expect(html).toContain('name="cadeira"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("Cadeira 1");
    expect(html).not.toContain('role="listbox"');
    expect(html).toContain("hover:border-campo-borda-hover");
    expect(html).toContain("disabled:bg-desabilitado");
    expect(html).toContain("shadow-paper-sm");
  });

  it("dado o rótulo, quando aponta para o campo, então o htmlFor fica no label", () => {
    const html = renderToStaticMarkup(createElement(Label, { htmlFor: "nome" }, "Nome do paciente"));
    expect(html).toContain("<label");
    expect(html).toContain('for="nome"');
    expect(html).toContain("Nome do paciente");
    expect(html).toContain("text-tinta");
    expect(html).toContain("peer-disabled:text-desabilitado-tinta");
  });
});

describe("superfície Paper", () => {
  it("dado o cartão, quando compõe título e rodapé, então usa borda, sombra e papel", () => {
    const html = renderToStaticMarkup(
      createElement(
        Card,
        { size: "sm" },
        createElement(
          CardHeader,
          null,
          createElement(CardTitle, null, "Paciente"),
          createElement(CardDescription, null, "Cadastro da clínica"),
        ),
        createElement(CardContent, null, "Conteúdo"),
        createElement(CardFooter, null, "Rodapé"),
      ),
    );
    expect(html).toContain('data-slot="card"');
    expect(html).toContain('data-size="sm"');
    expect(html).toContain("border-borda-papel");
    expect(html).toContain("shadow-paper-sm");
    expect(html).toContain("rounded-paper-md");
    expect(html).toContain("Paciente");
    expect(html).toContain("bg-papel");
  });

  it("dado a tabela, quando a linha existe, então o hover e o cabeçalho usam o papel", () => {
    const html = renderToStaticMarkup(
      createElement(
        Table,
        null,
        createElement(
          TableHeader,
          null,
          createElement(TableRow, null, createElement(TableHead, null, "Paciente")),
        ),
        createElement(
          TableBody,
          null,
          createElement(
            TableRow,
            { "data-state": "selected" },
            createElement(TableCell, null, "Ana"),
          ),
        ),
      ),
    );
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("border-borda-papel");
    expect(html).toContain("hover:bg-papel");
    expect(html).toContain('data-state="selected"');
    expect(html).toContain("Ana");
  });

  it("dado o selo, quando a variante muda, então a cor do estado acompanha o token", () => {
    expect(badgeVariants({ variant: "default" })).toContain("bg-primary");
    expect(badgeVariants({ variant: "success" })).toContain("bg-ok-fundo");
    expect(badgeVariants({ variant: "warning" })).toContain("bg-aviso-fundo");
    expect(badgeVariants({ variant: "destructive" })).toContain("text-perigo-tinta");
    expect(badgeVariants({ variant: "outline" })).toContain("border-borda-papel");
    const html = renderToStaticMarkup(createElement(Badge, { variant: "warning" }, "Em espera"));
    expect(html).toContain("Em espera");
    expect(html).toContain("bg-aviso-fundo");
    expect(html).toContain("focus-visible:outline-destaque");
    expect(html).toContain("aria-invalid:border-perigo");
  });
});

describe("checkbox Paper", () => {
  it("dado o checkbox inválido, quando renderiza, então o alvo e o erro ficam na classe", () => {
    const html = renderToStaticMarkup(
      createElement(Checkbox, { "aria-invalid": true, "aria-label": "Ativo" }),
    );
    expect(html).toContain('role="checkbox"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("aria-invalid:border-perigo");
    expect(html).toContain("focus-visible:outline-destaque");
    expect(html).toContain("disabled:bg-desabilitado");
    expect(html).toContain("data-checked:bg-primary");
    expect(html).toContain("after:-inset-x-3");
  });

  it("dado o checkbox marcado, quando o estado é controlado, então aria-checked fica verdadeiro", async () => {
    await montar(createElement(Checkbox, { checked: true, "aria-label": "Confirmado" }));
    const caixa = document.querySelector('[role="checkbox"]');
    expect(caixa?.getAttribute("aria-checked")).toBe("true");
    expect(caixa?.hasAttribute("data-checked")).toBe(true);
  });
});

describe("diálogo Paper", () => {
  it("dado o gatilho na casca, quando o diálogo abre, então o foco entra, o portal sai da casca e o aria nomeia o título", async () => {
    await montar(
      createElement(
        "div",
        { className: "casca" },
        createElement(
          Dialog,
          null,
          createElement(DialogTrigger, null, "Abrir diálogo"),
          createElement(
            DialogContent,
            null,
            createElement(
              DialogHeader,
              null,
              createElement(DialogTitle, null, "Confirmar horário"),
              createElement(DialogDescription, null, "A cadeira fica ocupada nesse horário."),
            ),
            createElement("button", { type: "button" }, "Confirmar"),
          ),
        ),
      ),
    );

    const gatilho = [...document.querySelectorAll("button")].find((botao) =>
      botao.textContent?.includes("Abrir diálogo"),
    );
    expect(gatilho).toBeTruthy();
    expect(gatilho?.getAttribute("aria-haspopup")).toBe("dialog");
    expect(gatilho?.getAttribute("aria-expanded")).toBe("false");
    expect(dialogoVisivel()).toBeNull();

    await act(async () => {
      gatilho?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    await esperar(() => dialogoVisivel() !== null);

    const dialog = dialogoVisivel();
    expect(dialog).toBeTruthy();
    expect(document.querySelector(".casca")?.contains(dialog)).toBe(false);
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect([...dialog!.querySelectorAll("button")].some((botao) => botao.textContent?.includes("Fechar"))).toBe(
      true,
    );
    const rotulo = dialog?.getAttribute("aria-labelledby");
    const descricao = dialog?.getAttribute("aria-describedby");
    expect(rotulo).toBeTruthy();
    expect(document.getElementById(rotulo ?? "")?.textContent).toBe("Confirmar horário");
    expect(descricao).toBeTruthy();
    expect(document.getElementById(descricao ?? "")?.textContent).toContain("cadeira");
    expect(dialog?.contains(document.activeElement)).toBe(true);
    expect(dialog?.className).toContain("bg-card");
    expect(dialog?.className).toContain("shadow-paper-overlay");
    expect(dialog?.className).not.toContain("casca");
    expect(document.querySelector("[data-slot=dialog-overlay]")?.className).toContain("bg-overlay");
  });

  it("dado o diálogo aberto, quando Esc é pressionado, então ele fecha e o foco volta ao gatilho", async () => {
    await montar(
      createElement(
        Dialog,
        null,
        createElement(DialogTrigger, null, "Abrir diálogo"),
        createElement(
          DialogContent,
          null,
          createElement(DialogTitle, null, "Confirmar horário"),
          createElement(DialogDescription, null, "A cadeira fica ocupada nesse horário."),
        ),
      ),
    );

    const gatilho = [...document.querySelectorAll("button")].find((botao) =>
      botao.textContent?.includes("Abrir diálogo"),
    );
    expect(gatilho).toBeTruthy();
    await act(async () => {
      gatilho?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    await esperar(() => dialogoVisivel() !== null);
    expect(dialogoVisivel()?.contains(document.activeElement)).toBe(true);

    await act(async () => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }),
      );
    });
    await esperar(() => dialogoVisivel() === null);

    expect(dialogoVisivel()).toBeNull();
    expect(document.activeElement).toBe(gatilho);
  });
});
