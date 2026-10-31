import { describe, expect, it } from "vitest";
import {
  CLINICA_CADEIRAS_VAZIO,
  CLINICA_SEM_CLINICA,
  CLINICA_SUGESTAO_HORARIO,
  mensagemComDetalhe as detalheClinica,
} from "../../src/app/clinica/texto";
import {
  DENTISTAS_NOTA,
  DENTISTAS_VAZIO,
  mensagemComDetalhe as detalheDentistas,
} from "../../src/app/dentistas/texto";
import {
  USUARIOS_NOTA_REMOCAO,
  USUARIOS_VAZIO,
  mensagemComDetalhe as detalheUsuarios,
} from "../../src/app/usuarios/texto";

describe("textos da tela Usuários", () => {
  it("dado nenhum usuário, quando a lista abre, então o vazio diz que falta cadastro", () => {
    expect(USUARIOS_VAZIO).toBe("Nenhum usuário cadastrado nesta clínica.");
  });

  it("quando a tela explica a remoção, então diz que agendamento e prontuário ficam", () => {
    expect(USUARIOS_NOTA_REMOCAO).toBe("Remover o acesso não apaga agendamento nem prontuário.");
  });

  it("dado um detalhe, quando o aviso é montado, então o nome vem depois da mensagem", () => {
    expect(detalheUsuarios("Usuário cadastrado", "Ana")).toBe("Usuário cadastrado: Ana");
    expect(detalheUsuarios("Acesso removido", "")).toBe("Acesso removido");
  });
});

describe("textos da tela Clínica", () => {
  it("dado conta sem clínica, quando a tela abre, então explica o que criar", () => {
    expect(CLINICA_SEM_CLINICA).toBe(
      "Esta conta ainda não tem clínica. Crie a clínica para configurar horário e cadeiras.",
    );
  });

  it("quando a clínica é nova, então a sugestão de horário é visível em texto", () => {
    expect(CLINICA_SUGESTAO_HORARIO).toBe("Sugestão: 08:00–18:00");
  });

  it("dado clínica sem cadeira, quando a lista abre, então o vazio diz o que falta", () => {
    expect(CLINICA_CADEIRAS_VAZIO).toBe("Nenhuma cadeira cadastrada nesta clínica.");
  });

  it("dado um detalhe, quando o aviso é montado, então a cadeira vem depois da mensagem", () => {
    expect(detalheClinica("Cadeira adicionada", "Cadeira 2")).toBe("Cadeira adicionada: Cadeira 2");
    expect(detalheClinica("Horário salvo", "")).toBe("Horário salvo");
  });
});

describe("textos da tela Dentistas", () => {
  it("dado nenhum dentista, quando a lista abre, então o vazio diz que falta cadastro", () => {
    expect(DENTISTAS_VAZIO).toBe("Nenhum dentista cadastrado nesta clínica.");
  });

  it("quando a tela explica o cadastro, então diz do acesso e da remoção", () => {
    expect(DENTISTAS_NOTA).toBe(
      "O cadastro também cria o acesso de papel Dentista. Remover tira agendamentos novos com ele; os já marcados ficam.",
    );
  });

  it("dado um detalhe, quando o aviso é montado, então o nome vem depois da mensagem", () => {
    expect(detalheDentistas("Dentista cadastrado", "Rui")).toBe("Dentista cadastrado: Rui");
    expect(detalheDentistas("Dentista removido", "")).toBe("Dentista removido");
  });
});
