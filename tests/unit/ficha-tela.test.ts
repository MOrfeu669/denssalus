// @vitest-environment happy-dom

import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CabecalhoCasca } from "../../src/app/casca-cabecalho";
import { gruposDaCasca } from "../../src/app/casca-menu";
import { LateralCasca } from "../../src/app/casca-lateral";
import { Ficha } from "../../src/app/prontuarios/[pacienteId]/ficha";
import { Odontograma } from "../../src/app/prontuarios/[pacienteId]/odontograma";
import type { RegistroOdontograma } from "../../src/domain/odontograma/tipos";
import type { Sessao } from "../../src/domain/auth/tipos";

vi.mock("next/navigation", () => ({
  usePathname: () => "/prontuarios/paciente-1",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

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

function registro(parcial: Partial<RegistroOdontograma> & Pick<RegistroOdontograma, "id" | "dente" | "procedimentoId" | "registradoEm">): RegistroOdontograma {
  return {
    clinicaId: "c1",
    pacienteId: "p1",
    quadrante: "inferior_esquerdo",
    origem: "atendimento",
    agendamentoId: null,
    status: "confirmado",
    registradoPor: "u1",
    ...parcial,
  };
}

const PROCEDIMENTOS = [
  { id: "carie", nome: "Diagnóstico de cárie (OM)" },
  { id: "canal", nome: "Tratamento de canal" },
  { id: "rest", nome: "Restauração em resina (O)" },
  { id: "coroa", nome: "Coroa metalocerâmica" },
  { id: "extra", nome: "Extração" },
  { id: "outro", nome: "Profilaxia" },
];

function odontograma() {
  return createElement(Odontograma, {
    pacienteId: "p1",
    podeEscrever: true,
    procedimentos: PROCEDIMENTOS,
    agendamentos: [],
    registros: [
      registro({ id: "1", dente: 36, procedimentoId: "carie", registradoEm: "2026-11-10T10:00:00.000Z" }),
      registro({ id: "2", dente: 36, procedimentoId: "canal", registradoEm: "2026-11-24T10:00:00.000Z" }),
      registro({ id: "3", dente: 24, procedimentoId: "carie", registradoEm: "2026-11-10T11:00:00.000Z" }),
      registro({ id: "4", dente: 15, procedimentoId: "rest", registradoEm: "2026-10-28T10:00:00.000Z" }),
      registro({ id: "5", dente: 21, procedimentoId: "coroa", registradoEm: "2021-03-03T10:00:00.000Z" }),
      registro({ id: "6", dente: 16, procedimentoId: "extra", registradoEm: "2024-01-01T10:00:00.000Z" }),
      registro({ id: "7", dente: 11, procedimentoId: "outro", registradoEm: "2023-01-01T10:00:00.000Z" }),
    ],
  });
}

async function montar(elemento: ReturnType<typeof createElement>) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => {
    root.render(elemento);
  });
}

function botao(texto: string) {
  return [...document.querySelectorAll("button")].find((item) => item.textContent?.includes(texto));
}

describe("odontograma na ficha", () => {
  it("dado o dente 36 com cárie e canal, quando a ficha abre, então as cinco faces aparecem e só O e M ficam com cárie", async () => {
    await montar(odontograma());
    const dente = document.querySelector('button.dente[aria-pressed="true"]');
    expect(dente?.getAttribute("aria-label")).toContain("Dente 36");
    expect(dente?.querySelectorAll("[data-face]")).toHaveLength(5);
    expect(dente?.querySelector('[data-face="O"]')?.getAttribute("data-marca")).toBe("carie");
    expect(dente?.querySelector('[data-face="M"]')?.getAttribute("data-marca")).toBe("carie");
    expect(dente?.querySelector('[data-face="V"]')?.getAttribute("data-marca")).toBe("livre");
    expect(dente?.querySelector("[data-canal]")).not.toBeNull();
    expect(document.body.textContent).toContain("tratamento de canal");
    expect(document.body.textContent).not.toContain("Profilaxia");
  });

  it("dado mais de cinco registros, quando pede ver todos, então o restante entra na tabela", async () => {
    await montar(odontograma());
    await act(async () => {
      botao("Ver todos")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(document.body.textContent).toContain("Profilaxia");
  });

  it("dado a arcada decídua, quando troca o segmento, então não abre o registro de um dente fora do modelo", async () => {
    await montar(odontograma());
    await act(async () => {
      botao("Decídua")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(document.body.textContent).toContain("dentição decídua");
    expect(botao("Registrar procedimento")?.hasAttribute("disabled")).toBe(true);
    expect(document.querySelector('button[aria-label^="Dente 55"]')).not.toBeNull();
  });
});

describe("abas e decisões da casca na ficha", () => {
  it("dado a ficha, quando troca de aba e pede a evolução, então o painel correspondente aparece", async () => {
    await montar(
      createElement(Ficha, {
        nome: "Ana Beatriz Moura",
        iniciaisNome: "AM",
        meta: "34 anos · Feminino",
        responsavel: null,
        canais: [{ canal: "whatsapp", contato: "(11) 98765-4321" }],
        alertas: [{ tipo: "alergia", titulo: "Alergia: penicilina", orientacao: null }],
        debitoRotulo: "Débito R$ 450,00",
        podeEvoluir: true,
        destinoAgenda: "/agenda?paciente=p1",
        abas: [
          { id: "visao-geral", rotulo: "Visão geral" },
          { id: "odontograma", rotulo: "Odontograma" },
          { id: "evolucoes", rotulo: "Evoluções", contagem: 2 },
        ],
        inicial: "odontograma",
        paineis: {
          "visao-geral": createElement("p", null, "painel-visao"),
          odontograma: createElement("p", null, "painel-odonto"),
          evolucoes: createElement("textarea", { id: "evolucao-texto" }, "texto"),
        },
        lateral: createElement("p", null, "lateral-da-ficha"),
      }),
    );

    expect(document.body.textContent).toContain("painel-odonto");
    expect(document.body.textContent).toContain("Alergia: penicilina");
    expect(document.body.textContent).toContain("Débito R$ 450,00");
    expect(document.querySelector('a[href="/agenda?paciente=p1"]')?.textContent).toContain("Agendar consulta");
    expect(document.body.textContent).not.toContain("Ajuda");
    expect(document.querySelector("select")).toBeNull();

    await act(async () => {
      botao("Visão geral")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(document.body.textContent).toContain("painel-visao");

    await act(async () => {
      botao("Registrar evolução")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(document.activeElement?.id).toBe("evolucao-texto");
  });

  it("dado a ficha aberta na casca, quando a tela monta, então a voz segue acessível e Mensagens não ganha contador", async () => {
    const sessao: Sessao = {
      usuario: {
        id: "u1",
        nome: "Dra. Mariana Lopes",
        email: "mariana@example.com",
        papel: "admin",
        clinicaId: "c1",
        ativo: true,
      },
    };
    await montar(
      createElement(
        "div",
        null,
        createElement(LateralCasca, { sessao, clinicaNome: "Clínica Sorriso Pleno", contadores: { "/retornos": 6, "/mensagens": 3 } }),
        createElement(CabecalhoCasca, {
          busca: createElement("div", null, "busca"),
          sino: createElement("button", { type: "button", "aria-label": "Notificações" }, "sino"),
        }),
        createElement("button", { type: "button", "data-voz-flutuante": "", "aria-label": "Iniciar conversa por voz" }, "Assistente de voz"),
        createElement(Ficha, {
          nome: "Ana",
          iniciaisNome: "A",
          meta: "34 anos",
          responsavel: null,
          canais: [],
          alertas: [],
          debitoRotulo: null,
          podeEvoluir: false,
          destinoAgenda: "/agenda?paciente=p1",
          abas: [{ id: "visao-geral", rotulo: "Visão geral" }],
          inicial: "visao-geral",
          paineis: { "visao-geral": createElement("p", null, "ficha") },
          lateral: createElement("p", null, "lateral"),
        }),
      ),
    );

    expect(document.querySelector('a[href="/voz"]')?.textContent).toContain("Assistente de voz");
    expect(document.querySelector('button[aria-label="Assistente de voz"]')).not.toBeNull();
    expect(document.querySelector("[data-voz-flutuante]")).not.toBeNull();
    expect(gruposDaCasca("dentista").find((grupo) => grupo.id === "gestao")?.itens).toContainEqual({
      href: "/voz",
      rotulo: "Assistente de voz",
    });
    const mensagens = document.querySelector('a[href="/mensagens"]');
    expect(mensagens?.textContent).toContain("Mensagens");
    expect(mensagens?.textContent).not.toContain("3");
    expect(document.querySelector('a[href="/retornos"]')?.textContent).toContain("6");
    expect(document.body.textContent).toContain("Clínica Sorriso Pleno");
    expect(document.body.textContent).not.toContain("Unidade");
    expect(document.querySelector("[aria-label='Ajuda']")).toBeNull();

    const css = readFileSync(resolve(__dirname, "../../src/app/prontuarios/[pacienteId]/tela.css"), "utf8");
    const layout = readFileSync(resolve(__dirname, "../../src/app/layout.tsx"), "utf8");
    expect(css).not.toContain("voz-flutuante");
    expect(layout).toContain("BotaoVoz");
    expect(document.querySelectorAll('[role="tablist"]')).toHaveLength(1);
  });
});
