import { describe, expect, it } from "vitest";
import { quadranteDe } from "../../src/domain/odontograma/regras";
import type { Paciente } from "../../src/domain/paciente/tipos";
import {
  alertasDaAnamnese,
  aparenciaDe,
  cpfMascarado,
  denteMaisRecente,
  facesDoNome,
  fileirasDeciduas,
  hrefAgendar,
  hrefRemarcar,
  iniciais,
  linhaMeta,
  nomeDoDente,
  planoEmFoco,
  proximaConsulta,
  resumoDoDente,
  resumoFinanceiro,
  saldoDevedor,
  textoDoLembrete,
} from "../../src/app/prontuarios/[pacienteId]/ficha-dados";

const HOJE = new Date(2026, 10, 24, 12, 0, 0);

function paciente(parcial: Partial<Paciente> = {}): Paciente {
  return {
    id: "p1",
    clinicaId: "c1",
    nome: "Ana Beatriz Moura",
    canais: [{ canal: "whatsapp", contato: "(11) 98765-4321", preferido: true }],
    cpf: "12348231700",
    endereco: null,
    dataNascimento: "1992-03-10",
    sexo: "feminino",
    responsavel: null,
    ...parcial,
  };
}

describe("ficha do paciente", () => {
  it("dado a anamnese com alergia e condição, quando a ficha abre, então os alertas ficam separados da orientação", () => {
    const alertas = alertasDaAnamnese(
      ["Alergia: penicilina", "Prescrever clindamicina como alternativa.", "Condição: Hipertensão controlada — Aferir pressão."].join(
        "\n",
      ),
    );

    expect(alertas).toEqual([
      {
        tipo: "alergia",
        titulo: "Alergia: penicilina",
        orientacao: "Prescrever clindamicina como alternativa.",
      },
      {
        tipo: "condicao",
        titulo: "Hipertensão controlada",
        orientacao: "Aferir pressão.",
      },
    ]);
  });

  it("dado o cadastro, quando monta o cabeçalho, então mascara o CPF e calcula a idade", () => {
    expect(cpfMascarado("123.482.317-00")).toBe("•••.482.317-••");
    expect(iniciais("Ana Beatriz Moura")).toBe("AM");
    expect(linhaMeta(paciente(), HOJE)).toBe("34 anos · Feminino · CPF •••.482.317-••");
    expect(nomeDoDente(36)).toBe("1º molar inferior esquerdo");
  });

  it("dado cárie nas faces O e M e canal confirmados, quando pinta o dente, então as outras faces ficam livres e o revertido não pinta", () => {
    const aparencia = aparenciaDe(
      [
        {
          dente: 36,
          procedimentoNome: "Diagnóstico de cárie (OM)",
          status: "confirmado",
          registradoEm: "2026-11-10T10:00:00.000Z",
        },
        {
          dente: 36,
          procedimentoNome: "Restauração em resina (V)",
          status: "revertido",
          registradoEm: "2026-11-12T10:00:00.000Z",
        },
        {
          dente: 36,
          procedimentoNome: "Tratamento de canal",
          status: "confirmado",
          registradoEm: "2026-11-24T10:00:00.000Z",
        },
      ],
      [{ procedimentoNome: "Restauração (D)", dentes: [36], valor: 100, status: "pendente" }],
      36,
    );

    expect(aparencia.faces).toEqual({ O: "carie", M: "carie", D: "plan" });
    expect(aparencia.canal).toBe(true);
    expect(aparencia.ausente).toBe(false);
    expect(facesDoNome("Restauração em resina (O)")).toEqual(["O"]);
    expect(resumoDoDente(aparencia, null)).toContain("Cárie nas faces O e M");
    expect(resumoDoDente(aparencia, null)).toContain("tratamento de canal");
  });

  it("dado uma extração confirmada por último, quando pinta o dente, então ele fica ausente", () => {
    const aparencia = aparenciaDe(
      [
        {
          dente: 18,
          procedimentoNome: "Restauração (O)",
          status: "confirmado",
          registradoEm: "2020-01-01T00:00:00.000Z",
        },
        {
          dente: 18,
          procedimentoNome: "Extração",
          status: "confirmado",
          registradoEm: "2024-01-01T00:00:00.000Z",
        },
      ],
      [],
      18,
    );

    expect(aparencia.ausente).toBe(true);
    expect(aparencia.faces).toEqual({});
    expect(resumoDoDente(aparencia, null)).toBe("Ausente");
  });

  it("dado a dentição decídua, quando compara com o modelo, então nenhum desses números é dente gravável", () => {
    const { superior, inferior } = fileirasDeciduas();
    expect(superior).toHaveLength(10);
    expect(inferior).toHaveLength(10);
    for (const dente of [...superior, ...inferior]) expect(quadranteDe(dente)).toBeNull();
  });

  it("dado débitos e plano, quando resume o financeiro, então separa pago, em aberto e o que ainda falta faturar", () => {
    const debitos = [
      { valor: 450, desconto: 0, status: "em_aberto" as const },
      { valor: 1800, desconto: 70, status: "quitado" as const },
    ];
    expect(saldoDevedor(debitos)).toBe(450);
    const plano = planoEmFoco([
      { status: "concluido", criadoEm: "2026-01-01T00:00:00.000Z", id: "velho" },
      { status: "em_andamento", criadoEm: "2026-02-01T00:00:00.000Z", id: "atual" },
    ]);
    expect(plano?.id).toBe("atual");
    const resumo = resumoFinanceiro(debitos, {
      itens: [
        { valor: 1730, status: "concluido" },
        { valor: 2170, status: "pendente" },
      ],
    });
    expect(resumo.pago).toBe(1730);
    expect(resumo.emAberto).toBe(450);
    expect(resumo.aFaturar).toBe(2170);
    expect(resumo.totalPlano).toBe(3900);
  });

  it("dado a agenda do paciente, quando escolhe a próxima consulta, então fica o próximo horário ativo", () => {
    const proxima = proximaConsulta(
      [
        { id: "passada", status: "agendado", inicio: "2026-11-20T09:00" },
        { id: "futura", status: "agendado", inicio: "2026-11-26T14:00" },
        { id: "depois", status: "agendado", inicio: "2026-12-02T09:00" },
        { id: "cancelada", status: "cancelado", inicio: "2026-11-25T08:00" },
      ],
      HOJE,
    );
    expect(proxima?.id).toBe("futura");
    expect(hrefAgendar("p1")).toBe("/agenda?paciente=p1");
    expect(hrefRemarcar("p1", "2026-11-26T14:00")).toBe("/agenda?paciente=p1&data=2026-11-26");
    expect(denteMaisRecente([
      { dente: 15, status: "confirmado", registradoEm: "2026-10-01T00:00:00.000Z" },
      { dente: 36, status: "confirmado", registradoEm: "2026-11-24T00:00:00.000Z" },
      { dente: 21, status: "revertido", registradoEm: "2026-11-25T00:00:00.000Z" },
    ])).toBe(36);
  });

  it("dado o lembrete, quando o horário já passou ou não há canal, então a tela explica em vez de enviar", () => {
    expect(textoDoLembrete("2026-11-20T09:00", "whatsapp", HOJE)).toContain("já passou");
    expect(textoDoLembrete("2026-11-26T14:00", null, HOJE)).toContain("não tem canal preferido");
    expect(textoDoLembrete("2026-11-26T14:00", "whatsapp", HOJE)).toContain("Não há envio manual");
  });
});
