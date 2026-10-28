import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { cancelarAgendamento, criarAgendamento } from "../../src/domain/agendamento/casos";
import {
  enviarPendentes,
  notificarAgendamentoCriado,
  reenviarFalhas,
} from "../../src/domain/mensagem/casos";
import { MENSAGEM_FALHA_ENVIO } from "../../src/domain/mensagem/tipos";
import {
  CLINICA,
  CRIACAO,
  DUAS_HORAS,
  EMAIL,
  ENTRADA,
  MENOS_24H,
  MENOS_5H,
  Memoria,
  PACIENTE,
  SMS,
  SMS_PREF,
  TEXTO_CONFIRMACAO,
  WHATSAPP,
  consulta,
  paciente,
  pendente,
  preparar,
  sessao,
} from "./apoio-mensagem";

describe("mensagem externa", () => {
  let memoria: Memoria;

  beforeEach(() => {
    memoria = new Memoria();
    memoria.notificacoes.usuarios = [{ id: "recepcao-ana", papel: "recepcionista", ativo: true }];
  });

  it("dado WhatsApp preferido e consulta em 15/10 às 14:00, quando envia pendentes no instante da criação, então o enviador recebe 15/10 e 14:00 só no WhatsApp", async () => {
    const agendamento = preparar(memoria, [SMS, EMAIL, WHATSAPP]);
    const deps = memoria.deps();

    await notificarAgendamentoCriado(deps, agendamento, CRIACAO);
    expect(memoria.pedidos).toEqual([]);

    await enviarPendentes(deps, CLINICA, CRIACAO);

    expect(memoria.pedidos).toEqual([
      { canal: "whatsapp", contato: "11 98888-0000", texto: TEXTO_CONFIRMACAO },
    ]);
    expect(memoria.mensagens.find((item) => item.tipo === "confirmacao_agendamento")).toMatchObject({
      status: "enviado",
      tentativas: 0,
      enviadoEm: CRIACAO.toISOString(),
    });
  });

  it("dado SMS preferido e e-mail também cadastrado, quando envia a confirmação, então só o SMS é chamado", async () => {
    const agendamento = preparar(memoria, [EMAIL, SMS_PREF]);
    const deps = memoria.deps();

    await notificarAgendamentoCriado(deps, agendamento, CRIACAO);
    await enviarPendentes(deps, CLINICA, CRIACAO);

    expect(memoria.pedidos).toEqual([
      { canal: "sms", contato: "11 97777-0001", texto: TEXTO_CONFIRMACAO },
    ]);
  });

  it("dado consulta futura, quando o relógio chega em 24h e depois em 5h, então os lembretes saem nesses intervalos e não em 2h", async () => {
    const agendamento = preparar(memoria, [WHATSAPP]);
    const deps = memoria.deps();

    await notificarAgendamentoCriado(deps, agendamento, CRIACAO);

    expect(memoria.mensagens.find((item) => item.tipo === "lembrete_24h")?.programadoPara).toBe(
      MENOS_24H.toISOString(),
    );
    expect(memoria.mensagens.find((item) => item.tipo === "lembrete_5h")?.programadoPara).toBe(
      MENOS_5H.toISOString(),
    );

    await enviarPendentes(deps, CLINICA, CRIACAO);
    await enviarPendentes(deps, CLINICA, DUAS_HORAS);
    expect(memoria.pedidos.map((pedido) => pedido.texto)).toEqual([TEXTO_CONFIRMACAO]);

    await enviarPendentes(deps, CLINICA, MENOS_24H);
    expect(memoria.pedidos.map((pedido) => pedido.texto)).toEqual([
      TEXTO_CONFIRMACAO,
      "Você tem uma consulta marcada",
    ]);

    await enviarPendentes(deps, CLINICA, MENOS_5H);
    expect(memoria.pedidos).toEqual([
      { canal: "whatsapp", contato: WHATSAPP.contato, texto: TEXTO_CONFIRMACAO },
      { canal: "whatsapp", contato: WHATSAPP.contato, texto: "Você tem uma consulta marcada" },
      {
        canal: "whatsapp",
        contato: WHATSAPP.contato,
        texto: "Lembrete: você tem uma consulta em 5 horas",
      },
    ]);
  });

  it("dado início já passado, inclusive emergência, quando notifica, então a lista fica vazia e o enviador não é chamado", async () => {
    const agora = new Date(2026, 9, 15, 16, 0);
    const agendamento = preparar(memoria, [WHATSAPP], { emergencia: true });
    const deps = memoria.deps();

    await notificarAgendamentoCriado(deps, agendamento, agora);
    await enviarPendentes(deps, CLINICA, agora);

    expect(memoria.mensagens).toEqual([]);
    expect(memoria.pedidos).toEqual([]);
  });

  it("dado lembrete de 24h já passado e início ainda futuro, quando notifica, então grava a confirmação e o de 5h e não grava o de 24h", async () => {
    const agendamento = preparar(memoria, [WHATSAPP]);

    await notificarAgendamentoCriado(memoria.deps(), agendamento, new Date(2026, 9, 15, 8, 0));

    expect(memoria.mensagens.map((item) => item.tipo)).toEqual([
      "confirmacao_agendamento",
      "lembrete_5h",
    ]);
    expect(memoria.pedidos).toEqual([]);
  });

  it("dado lembretes pendentes, quando o agendamento é cancelado, então enviarPendentes não chama o enviador", async () => {
    const agendamento = preparar(memoria, [WHATSAPP]);
    await notificarAgendamentoCriado(memoria.deps(), agendamento, CRIACAO);
    await cancelarAgendamento(
      memoria.depsAgenda(),
      sessao("recepcionista"),
      agendamento.id,
      "Paciente remarcou",
      CRIACAO,
      false,
    );

    await enviarPendentes(memoria.deps(), CLINICA, MENOS_24H);
    await enviarPendentes(memoria.deps(), CLINICA, MENOS_5H);

    expect(memoria.pedidos).toEqual([]);
    expect(memoria.agendamentos.get(agendamento.id)?.status).toBe("cancelado");
  });

  it("dado mensagem que falhou, quando o agendamento já está cancelado, então reenviarFalhas não chama o enviador", async () => {
    const agendamento = preparar(memoria, [WHATSAPP]);
    await notificarAgendamentoCriado(memoria.deps(), agendamento, CRIACAO);
    for (const mensagem of memoria.mensagens) mensagem.status = "falhou";
    await cancelarAgendamento(
      memoria.depsAgenda(),
      sessao("recepcionista"),
      agendamento.id,
      "Paciente remarcou",
      CRIACAO,
      false,
    );

    await reenviarFalhas(memoria.deps(), CLINICA, MENOS_24H);

    expect(memoria.pedidos).toEqual([]);
  });

  it("dado um agendamento, quando cancela, então não chama o enviador nem grava texto de cancelamento", async () => {
    let chamadas = 0;
    const agendamento = preparar(memoria, [WHATSAPP]);
    await notificarAgendamentoCriado(memoria.deps(), agendamento, CRIACAO);
    const textos = memoria.mensagens.map((item) => item.texto);

    await cancelarAgendamento(
      memoria.depsAgenda(async () => {
        chamadas += 1;
      }),
      sessao("recepcionista"),
      agendamento.id,
      "Paciente remarcou",
      CRIACAO,
      false,
    );

    expect(chamadas).toBe(0);
    expect(memoria.pedidos).toEqual([]);
    expect(memoria.mensagens.map((item) => item.texto)).toEqual(textos);
    expect(textos.some((texto) => /cancel/i.test(texto))).toBe(false);
  });

  it("dado o reagendamento da Feature 009, quando se lê o caso de retorno, então o módulo não importa enviador nem mensagem", () => {
    for (const arquivo of ["casos.ts", "portas.ts"]) {
      const fonte = readFileSync(join(process.cwd(), "src/domain/retorno", arquivo), "utf8");
      expect(fonte).not.toMatch(/from ["'][^"']*mensagem/);
      expect(fonte).not.toMatch(/enviador|Enviador/);
    }
  });

  it("dado falha no primeiro envio, quando a rotina termina, então fica falhou com zero tentativas e sem alerta", async () => {
    preparar(memoria, [WHATSAPP]);
    memoria.mensagens.push(pendente());
    memoria.respostas = ["falha"];

    await enviarPendentes(memoria.deps(), CLINICA, MENOS_24H);

    expect(memoria.mensagens[0]).toMatchObject({ status: "falhou", tentativas: 0, enviadoEm: null });
    expect(memoria.notificacoes.linhas).toEqual([]);
  });

  it("dado duas reenvios que falham, quando a segunda termina, então alerta falha_envio_mensagem uma vez", async () => {
    preparar(memoria, [WHATSAPP]);
    memoria.mensagens.push(pendente({ status: "falhou" }));
    memoria.respostas = ["erro", "erro"];

    await reenviarFalhas(memoria.deps(), CLINICA, MENOS_24H);
    expect(memoria.mensagens[0]).toMatchObject({ status: "falhou", tentativas: 1 });
    expect(memoria.notificacoes.linhas).toEqual([]);

    await reenviarFalhas(memoria.deps(), CLINICA, MENOS_24H);
    expect(memoria.mensagens[0]).toMatchObject({ status: "falhou", tentativas: 2 });
    expect(memoria.notificacoes.linhas).toMatchObject([
      {
        tipo: "falha_envio_mensagem",
        referenciaId: "msg-1",
        mensagem: MENSAGEM_FALHA_ENVIO,
        clinicaId: CLINICA,
      },
    ]);
    expect(MENSAGEM_FALHA_ENVIO).toBe("Falha no envio da mensagem ao paciente");

    await reenviarFalhas(memoria.deps(), CLINICA, MENOS_24H);
    expect(memoria.notificacoes.linhas).toHaveLength(1);
    expect(memoria.pedidos).toHaveLength(2);
  });

  it("dado a primeira reenvio bem-sucedida, quando reenvia, então marca enviado e não alerta", async () => {
    preparar(memoria, [WHATSAPP]);
    memoria.mensagens.push(pendente({ status: "falhou" }));
    memoria.respostas = ["ok"];

    await reenviarFalhas(memoria.deps(), CLINICA, MENOS_24H);

    expect(memoria.mensagens[0]).toMatchObject({
      status: "enviado",
      tentativas: 0,
      enviadoEm: MENOS_24H.toISOString(),
    });
    expect(memoria.notificacoes.linhas).toEqual([]);
  });

  it("dado a porta de notificação lançando, quando cria o agendamento, então ele permanece na lista", async () => {
    memoria.pacientes.set(PACIENTE, paciente([WHATSAPP]));
    const deps = memoria.depsAgenda(async () => {
      throw new Error("falha ao notificar");
    });

    const resultado = await criarAgendamento(deps, sessao("recepcionista"), ENTRADA);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect([...memoria.agendamentos.values()]).toContainEqual(resultado.valor);
  });

  it("dado paciente sem canal preferido, quando notifica, então não grava e não lança", async () => {
    const agendamento = preparar(memoria, [{ ...EMAIL, preferido: false }]);

    await expect(
      notificarAgendamentoCriado(memoria.deps(), agendamento, CRIACAO),
    ).resolves.toBeUndefined();
    expect(memoria.mensagens).toEqual([]);
    expect(memoria.pedidos).toEqual([]);
  });

  it("dado falha ao buscar o paciente, quando notifica, então não lança", async () => {
    memoria.falhaPaciente = true;

    await expect(
      notificarAgendamentoCriado(memoria.deps(), consulta(), CRIACAO),
    ).resolves.toBeUndefined();
    expect(memoria.mensagens).toEqual([]);
  });

  it("dado modelo com o nome do paciente, quando notifica, então o texto gravado não guarda placeholder", async () => {
    memoria.modelos.push({
      clinicaId: CLINICA,
      tipo: "confirmacao_agendamento",
      conteudo: "Olá {{paciente.nome}}, dia {{agendamento.data}} às {{agendamento.hora}}",
    });
    const agendamento = preparar(memoria, [WHATSAPP]);

    await notificarAgendamentoCriado(memoria.deps(), agendamento, CRIACAO);

    expect(memoria.mensagens.find((item) => item.tipo === "confirmacao_agendamento")?.texto).toBe(
      "Olá João Souza, dia 15/10 às 14:00",
    );
  });
});
