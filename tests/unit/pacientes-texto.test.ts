import { describe, expect, it } from "vitest";
import {
  ROTULO_CANAL,
  ROTULO_SEXO,
  TEXTO_VAZIO,
  textoAviso,
  textoIdade,
} from "../../src/app/pacientes/texto";

describe("textos da tela Pacientes", () => {
  it("dado o vazio, então a tela diz que não há paciente na clínica", () => {
    expect(TEXTO_VAZIO).toBe("Nenhum paciente cadastrado nesta clínica.");
  });

  it("dado cada canal, então o rótulo é SMS, E-mail ou WhatsApp", () => {
    expect(ROTULO_CANAL).toEqual({ sms: "SMS", email: "E-mail", whatsapp: "WhatsApp" });
  });

  it("dado o sexo, então o rótulo é masculino, feminino ou outro", () => {
    expect(ROTULO_SEXO).toEqual({ masculino: "masculino", feminino: "feminino", outro: "outro" });
  });

  it("dada a idade calculada, então o texto concorda com o número", () => {
    expect(textoIdade(1)).toBe("1 ano");
    expect(textoIdade(0)).toBe("0 anos");
    expect(textoIdade(17)).toBe("17 anos");
  });

  it("dada a mensagem da action, então o aviso a mostra e junta o detalhe quando há", () => {
    expect(textoAviso("CPF já cadastrado", "Ana Souza")).toBe("CPF já cadastrado: Ana Souza");
    expect(textoAviso("Informe ao menos um canal", "")).toBe("Informe ao menos um canal");
  });
});
