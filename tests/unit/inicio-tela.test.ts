import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Inicio } from "../../src/app/inicio";
import type { Sessao } from "../../src/domain/auth/tipos";
import type { BaseDaClinica } from "../../src/domain/inicio/tipos";

function sessao(papel: Sessao["usuario"]["papel"]): Sessao {
  return {
    usuario: { id: "u-1", nome: "Helena", email: "helena@x.test", papel, clinicaId: "c-1", ativo: true },
  };
}

function base(parcial: Partial<BaseDaClinica> = {}): BaseDaClinica {
  return {
    nome: "Clínica Sorriso",
    temClinica: true,
    temCadeiraAtiva: true,
    temDentistaAtivo: true,
    temPaciente: false,
    temAgendamento: false,
    ...parcial,
  };
}

describe("tela Início", () => {
  it("mostra um título visível para o guia, não só o rótulo de acessibilidade", () => {
    const html = renderToStaticMarkup(createElement(Inicio, { sessao: sessao("admin"), base: base({ temDentistaAtivo: false }) }));

    expect(html).toContain("Guia do caminho mínimo");
    expect(html).toContain('aria-labelledby="guia-titulo"');
  });

  it("mostra um título visível para os atalhos e o nome de quem entrou", () => {
    const html = renderToStaticMarkup(createElement(Inicio, { sessao: sessao("admin"), base: base({ temDentistaAtivo: false }) }));

    expect(html).toContain("Atalhos");
    expect(html).toContain("Helena");
    expect(html).toContain("Admin");
  });

  it("Admin: passo concluído mostra o texto do rótulo e 'Concluído'", () => {
    const html = renderToStaticMarkup(createElement(Inicio, { sessao: sessao("admin"), base: base({ temDentistaAtivo: false }) }));

    expect(html).toContain("Configurar a clínica");
    expect(html).toContain("Concluído");
  });

  it("Admin: passo atual mostra o rótulo como texto e também como botão de ação", () => {
    const html = renderToStaticMarkup(createElement(Inicio, { sessao: sessao("admin"), base: base({ temDentistaAtivo: false }) }));

    const ocorrencias = html.split("Cadastrar dentista").length - 1;
    expect(ocorrencias).toBeGreaterThanOrEqual(2);
    expect(html).toContain("casca-botao");
  });

  it("Dentista sem base vê o aviso de espera, sem passos nem links de passo", () => {
    const html = renderToStaticMarkup(
      createElement(Inicio, { sessao: sessao("dentista"), base: base({ temDentistaAtivo: false, temCadeiraAtiva: false, temClinica: false, nome: null }) }),
    );

    expect(html).toContain("O Admin ainda precisa configurar a clínica e cadastrar um dentista.");
    expect(html).not.toContain('id="guia-passos"');
  });
});
