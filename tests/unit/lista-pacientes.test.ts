import { describe, expect, it } from "vitest";
import { fatosParaExportar, filtrarLista, recortarLista, situacaoDe, type FatoLista, type PedidoLista } from "../../src/domain/paciente/lista";
import { montarFatos } from "../../src/domain/paciente/lista-fatos";
import type { Paciente } from "../../src/domain/paciente/tipos";
import { apresentarLinha, mascararCpfLista } from "../../src/app/pacientes/apresentar";
import { hrefDaLista, paginasDaLista } from "../../src/app/pacientes/consulta";
import { textoCsv } from "../../src/app/pacientes/csv";

const agora = new Date("2026-11-24T15:00:00.000Z");

function fato(parcial: Partial<FatoLista> & Pick<FatoLista, "id" | "nome">): FatoLista {
  return {
    clinicaId: "cli-a",
    cpf: null,
    dataNascimento: null,
    telefone: null,
    email: null,
    responsavelNome: null,
    emTratamento: false,
    comDebito: false,
    retornoPendente: false,
    ultimaVisita: null,
    proximaConsulta: null,
    ...parcial,
  };
}

function pedido(parcial: Partial<PedidoLista> = {}): PedidoLista {
  return { clinicaId: "cli-a", termo: "", chip: "todos", pagina: 1, porPagina: 10, agora, ...parcial };
}

const joao = fato({
  id: "joao",
  nome: "João Pedro Nogueira",
  cpf: "12348231700",
  telefone: "(11) 98123-7790",
  email: "jp.nogueira@email.com.br",
  dataNascimento: "1990-11-02",
  emTratamento: true,
  proximaConsulta: "2026-11-26T17:00:00.000Z",
  ultimaVisita: "2026-11-11T15:00:00.000Z",
});

const joaoOutra = fato({
  id: "joao-b",
  clinicaId: "cli-b",
  nome: "João Pedro Nogueira",
  cpf: "12348231700",
  emTratamento: true,
});

const carlos = fato({
  id: "carlos",
  nome: "Carlos Eduardo Farias",
  comDebito: true,
  emTratamento: true,
  proximaConsulta: "2026-12-02T12:00:00.000Z",
});

const leticia = fato({
  id: "leticia",
  nome: "Letícia Tavares",
  ultimaVisita: "2026-11-05T15:00:00.000Z",
});

const henrique = fato({
  id: "henrique",
  nome: "Henrique Nakamura",
  ultimaVisita: "2025-06-14T15:00:00.000Z",
});

const lista = [joao, joaoOutra, carlos, leticia, henrique];

describe("filtro ao vivo da lista de pacientes", () => {
  it("dado João, quando o termo ignora acento e maiúsculas, então a lista reduz para ele", () => {
    for (const termo of ["joao", "JOÃO", "João Pedro"]) {
      expect(filtrarLista(lista, pedido({ termo })).fatos.map((item) => item.id)).toEqual(["joao"]);
    }
  });

  it("dado o mesmo nome na outra clínica, quando filtra, então a outra clínica fica de fora", () => {
    const ids = filtrarLista(lista, pedido({ clinicaId: "cli-b", termo: "joao" })).fatos.map((item) => item.id);
    expect(ids).toEqual(["joao-b"]);
    expect(filtrarLista(lista, pedido({ termo: "joao" })).fatos.map((item) => item.id)).not.toContain("joao-b");
  });

  it("dado o termo e o chip de débito, quando os dois valem, então só entra quem tem os dois", () => {
    const soDebito = filtrarLista(lista, pedido({ chip: "com_debito" })).fatos.map((item) => item.id);
    expect(soDebito).toEqual(["carlos"]);
    expect(filtrarLista(lista, pedido({ termo: "joao", chip: "com_debito" })).fatos).toEqual([]);
    expect(filtrarLista([joao, { ...joao, id: "joao-debito", comDebito: true }], pedido({ termo: "joao", chip: "com_debito" })).fatos.map((item) => item.id)).toEqual(["joao-debito"]);
  });

  it("dado o aniversário no mês corrente, quando o chip é aniversariantes, então os outros meses ficam de fora", () => {
    const ids = filtrarLista(lista, pedido({ chip: "aniversariantes" })).fatos.map((item) => item.id);
    expect(ids).toEqual(["joao"]);
  });

  it("dado mais pacientes que a página, quando pede a página 2, então mostra o recorte e o total", () => {
    const fatos = Array.from({ length: 25 }, (_, indice) => fato({ id: `p${indice}`, nome: `Paciente ${String(indice).padStart(2, "0")}` }));
    const recorte = recortarLista(fatos, pedido({ pagina: 2, porPagina: 10 }));
    expect(recorte.totalFiltrado).toBe(25);
    expect(recorte.fatos).toHaveLength(10);
    expect(recorte.fatos[0]?.nome).toBe("Paciente 10");
    expect(recorte.pagina).toBe(2);
  });
});

describe("situação e CPF da lista", () => {
  it("dado débito e consulta futura, quando mostra a situação, então o débito fica na frente", () => {
    expect(situacaoDe(carlos, agora)).toBe("debito_em_aberto");
    expect(situacaoDe(joao, agora)).toBe("em_tratamento");
    expect(situacaoDe(leticia, agora)).toBe("alta");
    expect(situacaoDe(henrique, agora)).toBe("inativo");
  });

  it("dado retorno pendente sem consulta futura, quando mostra a situação, então fica retorno pendente", () => {
    const retorno = fato({ id: "mariana", nome: "Mariana", retornoPendente: true });
    const comConsulta = fato({
      id: "rita",
      nome: "Rita",
      retornoPendente: true,
      emTratamento: true,
      proximaConsulta: "2026-12-01T15:00:00.000Z",
    });
    expect(situacaoDe(retorno, agora)).toBe("retorno_pendente");
    expect(situacaoDe(comConsulta, agora)).toBe("em_tratamento");
  });

  it("dado o CPF completo, quando a lista mostra, então o começo e o fim ficam ocultos", () => {
    expect(mascararCpfLista("12348231700")).toBe("•••.482.317-••");
    expect(mascararCpfLista("123.482.317-00")).toBe("•••.482.317-••");
    expect(mascararCpfLista(null)).toBe("—");
    expect(apresentarLinha(joao, agora).iniciais).toBe("JP");
    expect(apresentarLinha(joao, agora).cpf).toBe("•••.482.317-••");
    expect(apresentarLinha(joao, agora).proximaConsulta).toBe("26/11 · 14:00");
  });
});

describe("CSV da lista de pacientes", () => {
  it("dado filtro e seleção, quando exporta, então o arquivo traz só a clínica, o filtro e o CPF mascarado", () => {
    const escolhidos = fatosParaExportar(lista, pedido({ termo: "joao" }), ["joao", "joao-b", "carlos"]);
    const csv = textoCsv(escolhidos.map((item) => apresentarLinha(item, agora)));
    expect(csv.startsWith("\uFEFFPaciente;Contato;CPF;")).toBe(true);
    expect(csv).toContain("João Pedro Nogueira");
    expect(csv).toContain("•••.482.317-••");
    expect(csv).not.toContain("12348231700");
    expect(csv).not.toContain("Carlos");
    expect(escolhidos.map((item) => item.id)).toEqual(["joao"]);
  });

  it("dado o filtro sem seleção, quando exporta, então entram todos do filtro e ninguém de outra clínica", () => {
    const escolhidos = fatosParaExportar(lista, pedido({ chip: "em_tratamento" }), []);
    expect(escolhidos.map((item) => item.id)).toEqual(["carlos", "joao"]);
  });
});

describe("endereço da lista", () => {
  it("dado a consulta, quando monta o endereço, então a clínica não vai na URL", () => {
    expect(hrefDaLista({ termo: "joao", chip: "com_debito", pagina: 2, porPagina: 25 })).toBe(
      "/pacientes?q=joao&chip=com_debito&pagina=2&linhas=25",
    );
    expect(hrefDaLista({ termo: "", chip: "todos", pagina: 1, porPagina: 10 })).toBe("/pacientes");
    expect(paginasDaLista(1, 1248, 10)).toEqual([1, 2, 3, "…", 125]);
  });
});

describe("fatos da lista a partir dos registros da clínica", () => {
  it("dado consulta futura, débito, retorno e plano, quando monta a lista, então cada marca fica no paciente certo", () => {
    const pacientes: Paciente[] = [
      {
        id: "ana",
        clinicaId: "cli-a",
        nome: "Ana Beatriz",
        canais: [
          { canal: "email", contato: "ana.moura@email.com.br", preferido: false },
          { canal: "whatsapp", contato: "(11) 98765-4321", preferido: true },
        ],
        cpf: "52948231725",
        endereco: null,
        dataNascimento: "1992-05-10",
        sexo: "feminino",
        responsavel: null,
      },
      {
        id: "gabriel",
        clinicaId: "cli-a",
        nome: "Gabriel Monteiro",
        canais: [{ canal: "whatsapp", contato: "(11) 99356-7721", preferido: true }],
        cpf: null,
        endereco: null,
        dataNascimento: "2015-03-20",
        sexo: null,
        responsavel: { nome: "Paula Monteiro", cpf: "12345678901", telefone: null },
      },
    ];
    const fatos = montarFatos(
      pacientes,
      [
        { pacienteId: "ana", inicio: "2026-11-26T17:00:00.000Z", status: "agendado" },
        { pacienteId: "ana", inicio: "2026-11-24T12:00:00.000Z", status: "concluido" },
        { pacienteId: "ana", inicio: "2026-11-20T12:00:00.000Z", status: "cancelado" },
        { pacienteId: "gabriel", inicio: "2026-11-01T12:00:00.000Z", status: "concluido" },
      ],
      [{ pacienteId: "ana", status: "em_aberto" }],
      [{ pacienteId: "gabriel", status: "pendente" }],
      [{ pacienteId: "gabriel", status: "em_andamento" }],
      agora,
    );
    const ana = fatos.find((item) => item.id === "ana");
    const gabriel = fatos.find((item) => item.id === "gabriel");
    expect(ana).toMatchObject({
      emTratamento: true,
      comDebito: true,
      retornoPendente: false,
      telefone: "(11) 98765-4321",
      email: "ana.moura@email.com.br",
      proximaConsulta: "2026-11-26T17:00:00.000Z",
      ultimaVisita: "2026-11-24T12:00:00.000Z",
    });
    expect(gabriel).toMatchObject({ emTratamento: true, retornoPendente: true, comDebito: false });
    expect(apresentarLinha(gabriel!, agora).nome).toBe("Gabriel Monteiro (menor)");
    expect(apresentarLinha(gabriel!, agora).complemento).toBe("Resp.: Paula Monteiro");
    expect(situacaoDe(ana!, agora)).toBe("debito_em_aberto");
  });
});
