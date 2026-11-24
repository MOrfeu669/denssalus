import { describe, expect, it } from "vitest";
import {
  filtrarPacientes,
  mascararCpf,
  normalizarCpf,
  normalizarTelefone,
  type AlvoBusca,
} from "../../src/domain/paciente/busca";

const clinicaA = "cli_a";
const clinicaB = "cli_b";

function alvo(parcial: Partial<AlvoBusca> & Pick<AlvoBusca, "id" | "clinicaId" | "nome">): AlvoBusca {
  return {
    cpf: null,
    telefones: [],
    ...parcial,
  };
}

const anaA = alvo({
  id: "pac_a",
  clinicaId: clinicaA,
  nome: "Ana Silva",
  cpf: "529.982.247-25",
  telefones: ["(11) 98888-7777"],
});

const anaB = alvo({
  id: "pac_b",
  clinicaId: clinicaB,
  nome: "Ana Silva",
  cpf: "52998224725",
  telefones: ["5511988887777"],
});

const joao = alvo({
  id: "pac_j",
  clinicaId: clinicaA,
  nome: "João Pereira",
  cpf: null,
  telefones: ["11977776666"],
});

describe("normalização de CPF e telefone", () => {
  it("dado o CPF com máscara ou só dígitos, quando normaliza, então os dois viram a mesma sequência", () => {
    expect(normalizarCpf("529.982.247-25")).toBe("52998224725");
    expect(normalizarCpf("52998224725")).toBe(normalizarCpf("529.982.247-25"));
  });

  it("dado o telefone com máscara, DDI ou só dígitos, quando normaliza, então o DDI 55 sai e a máscara some", () => {
    expect(normalizarTelefone("(11) 98888-7777")).toBe("11988887777");
    expect(normalizarTelefone("11988887777")).toBe("11988887777");
    expect(normalizarTelefone("+55 (11) 98888-7777")).toBe("11988887777");
  });

  it("dado um CPF completo, quando mascara para a lista, então o miolo não aparece", () => {
    expect(mascararCpf("529.982.247-25")).toBe("529.***.***-25");
    expect(mascararCpf("529.***.***-25")).toBeNull();
    expect(mascararCpf(null)).toBeNull();
  });
});

describe("busca de paciente por clínica", () => {
  const lista = [anaA, anaB, joao];

  it("dado o mesmo nome nas duas clínicas, quando busca na clínica A, então a clínica B fica de fora", () => {
    expect(filtrarPacientes(lista, clinicaA, "Ana").map((item) => item.id)).toEqual(["pac_a"]);
    expect(filtrarPacientes(lista, clinicaB, "Ana Silva").map((item) => item.id)).toEqual(["pac_b"]);
  });

  it("dado o CPF com ou sem máscara, quando busca, então acha só o paciente da clínica", () => {
    expect(filtrarPacientes(lista, clinicaA, "529.982.247-25").map((item) => item.id)).toEqual(["pac_a"]);
    expect(filtrarPacientes(lista, clinicaA, "52998224725").map((item) => item.id)).toEqual(["pac_a"]);
    expect(filtrarPacientes(lista, clinicaB, "52998224725").map((item) => item.id)).toEqual(["pac_b"]);
  });

  it("dado o telefone com ou sem máscara, quando busca, então acha só o paciente da clínica", () => {
    expect(filtrarPacientes(lista, clinicaA, "(11) 98888-7777").map((item) => item.id)).toEqual(["pac_a"]);
    expect(filtrarPacientes(lista, clinicaA, "11988887777").map((item) => item.id)).toEqual(["pac_a"]);
    expect(filtrarPacientes(lista, clinicaA, "11977776666").map((item) => item.id)).toEqual(["pac_j"]);
    expect(filtrarPacientes(lista, clinicaB, "(11) 98888-7777").map((item) => item.id)).toEqual(["pac_b"]);
  });

  it("dado um nome com acento, quando a busca não traz o acento, então ainda encontra o paciente da clínica", () => {
    expect(filtrarPacientes(lista, clinicaA, "joao").map((item) => item.id)).toEqual(["pac_j"]);
    expect(filtrarPacientes(lista, clinicaB, "joao")).toEqual([]);
  });

  it("dado um termo vazio, quando filtra, então não devolve a lista da clínica", () => {
    expect(filtrarPacientes(lista, clinicaA, "   ")).toEqual([]);
  });
});
