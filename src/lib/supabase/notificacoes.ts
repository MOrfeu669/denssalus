import { publicar } from "../../domain/notificacao/casos";
import type { Dependencias, Notificacoes, UsuarioAtivo } from "../../domain/notificacao/portas";
import { destinatarios } from "../../domain/notificacao/regras";
import type { Notificacao, TipoNotificacao } from "../../domain/notificacao/tipos";
import { lotesValidos, somarQuantidade } from "../../domain/estoque/regras";
import type { Lote } from "../../domain/estoque/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

type Linha = {
  id: string;
  clinica_id: string;
  destinatario_id: string;
  tipo: string;
  urgencia: string;
  referencia_id: string;
  mensagem: string;
  lida: boolean;
  resolvida: boolean;
  criada_em: string;
};

type LinhaAgendamento = {
  id: string;
  alerta_cadeira: boolean;
  alerta_horario: boolean;
  alerta_dentista: boolean;
};

type Desejo = {
  tipo: TipoNotificacao;
  referenciaId: string;
  mensagem: string;
  destinatarioIds: string[];
  // Aviso que não se resolve sozinho: uma vez resolvido por alguém, não reabre.
  unico: boolean;
};

type Baixa = { tipo: TipoNotificacao; referenciaId: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MOTIVO_RETORNO = "precisa ser reagendado";
const MENSAGEM_CADEIRA = "Cadeira indisponível";
const MENSAGEM_HORARIO = "Atendimento fora de horário";
const MENSAGEM_DENTISTA = "Dentista removido";
const MENSAGEM_PROTESE = "Atraso de prótese";
const MENSAGEM_CANCELAMENTO = "Comunicar o paciente sobre o cancelamento";

function paraNotificacao(linha: Linha): Notificacao {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    destinatarioId: linha.destinatario_id,
    tipo: linha.tipo as TipoNotificacao,
    urgencia: linha.urgencia as Notificacao["urgencia"],
    referenciaId: linha.referencia_id,
    mensagem: linha.mensagem,
    lida: linha.lida,
    resolvida: linha.resolvida,
    criadaEm: new Date(linha.criada_em).toISOString(),
  };
}

function paraLinha(notificacao: Notificacao): Linha {
  return {
    id: notificacao.id,
    clinica_id: notificacao.clinicaId,
    destinatario_id: notificacao.destinatarioId,
    tipo: notificacao.tipo,
    urgencia: notificacao.urgencia,
    referencia_id: notificacao.referenciaId,
    mensagem: notificacao.mensagem,
    lida: notificacao.lida,
    resolvida: notificacao.resolvida,
    criada_em: notificacao.criadaEm,
  };
}

function lerLinhas<T>(
  resposta: { data: unknown; error: unknown },
  mensagem: string,
): T[] {
  if (resposta.error) throw new ErroAplicacao(mensagem, resposta.error);
  return (resposta.data ?? []) as T[];
}

function criarPorta(): Notificacoes {
  const admin = createAdminClient();

  return {
    // Leitura crua. A versão exportada sincroniza antes de ler.
    async listar(clinicaId, destinatarioId) {
      const { data, error } = await admin
        .from("notificacoes_internas")
        .select("*")
        .eq("clinica_id", clinicaId)
        .eq("destinatario_id", destinatarioId)
        .order("criada_em", { ascending: false });
      if (error) throw new ErroAplicacao("Não foi possível listar as notificações", error);
      return (data as Linha[]).map(paraNotificacao);
    },

    async buscarAberta(destinatarioId, tipo, referenciaId) {
      const { data, error } = await admin
        .from("notificacoes_internas")
        .select("*")
        .eq("destinatario_id", destinatarioId)
        .eq("tipo", tipo)
        .eq("referencia_id", referenciaId)
        .eq("resolvida", false)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler a notificação", error);
      return data ? paraNotificacao(data as Linha) : null;
    },

    async salvar(notificacao) {
      const { error } = await admin.from("notificacoes_internas").insert(paraLinha(notificacao));
      // 23505: já existe uma aberta para o destinatário, o tipo e a referência.
      if (error?.code === "23505") return;
      if (error) throw new ErroAplicacao("Não foi possível salvar a notificação", error);
    },

    async atualizar(notificacao) {
      const { error } = await admin
        .from("notificacoes_internas")
        .update({
          urgencia: notificacao.urgencia,
          mensagem: notificacao.mensagem,
          lida: notificacao.lida,
          resolvida: notificacao.resolvida,
        })
        .eq("id", notificacao.id);
      if (error) throw new ErroAplicacao("Não foi possível atualizar a notificação", error);
    },
  };
}

export async function sincronizar(clinicaId: string): Promise<void> {
  const admin = createAdminClient();
  const porta = criarPorta();

  const [usuariosR, existentesR] = await Promise.all([
    admin
      .from("usuarios")
      .select("id, papel, ativo")
      .eq("clinica_id", clinicaId)
      .eq("ativo", true),
    admin.from("notificacoes_internas").select("*").eq("clinica_id", clinicaId),
  ]);

  const usuarios = lerLinhas<UsuarioAtivo>(usuariosR, "Não foi possível listar os usuários");
  const existentes = lerLinhas<Linha>(existentesR, "Não foi possível ler as notificações");

  const aberta = new Set<string>();
  const qualquer = new Set<string>();
  const abertaPorReferencia = new Set<string>();
  const referenciasAbertas = new Map<string, Set<string>>();
  for (const linha of existentes) {
    const chave = `${linha.destinatario_id}|${linha.tipo}|${linha.referencia_id}`;
    qualquer.add(chave);
    if (linha.resolvida) continue;
    aberta.add(chave);
    abertaPorReferencia.add(`${linha.tipo}|${linha.referencia_id}`);
    const refs = referenciasAbertas.get(linha.tipo) ?? new Set<string>();
    refs.add(linha.referencia_id);
    referenciasAbertas.set(linha.tipo, refs);
  }

  const desejos: Desejo[] = [];
  const baixas: Baixa[] = [];
  const todos = (tipo: TipoNotificacao) => destinatarios(usuarios, tipo);

  // Agendamentos: alertas de cadeira, horário e dentista.
  const refsAlerta = ["cadeira_indisponivel", "fora_de_horario", "dentista_removido"].flatMap(
    (tipo) => [...(referenciasAbertas.get(tipo) ?? [])],
  );
  const idsAlerta = [...new Set(refsAlerta)].filter((ref) => UUID.test(ref));
  const filtroAlerta = [
    "alerta_cadeira.eq.true",
    "alerta_horario.eq.true",
    "alerta_dentista.eq.true",
    ...(idsAlerta.length > 0 ? [`id.in.(${idsAlerta.join(",")})`] : []),
  ].join(",");
  const agendamentosR = await admin
    .from("agendamentos")
    .select("id, alerta_cadeira, alerta_horario, alerta_dentista")
    .eq("clinica_id", clinicaId)
    .or(filtroAlerta);
  for (const agendamento of lerLinhas<LinhaAgendamento>(
    agendamentosR,
    "Não foi possível ler os agendamentos",
  )) {
    const alertas: [boolean, TipoNotificacao, string][] = [
      [agendamento.alerta_cadeira, "cadeira_indisponivel", MENSAGEM_CADEIRA],
      [agendamento.alerta_horario, "fora_de_horario", MENSAGEM_HORARIO],
      [agendamento.alerta_dentista, "dentista_removido", MENSAGEM_DENTISTA],
    ];
    for (const [ligado, tipo, mensagem] of alertas) {
      if (ligado) {
        desejos.push({
          tipo,
          referenciaId: agendamento.id,
          mensagem,
          destinatarioIds: todos(tipo),
          unico: false,
        });
      } else {
        baixas.push({ tipo, referenciaId: agendamento.id });
      }
    }
  }

  // Estoque: materiais, lotes e avisos.
  const [materiaisR, avisosEstoqueR] = await Promise.all([
    admin.from("materiais").select("id, quantidade_minima").eq("clinica_id", clinicaId),
    admin
      .from("avisos_estoque")
      .select("material_id, tipo, texto")
      .eq("clinica_id", clinicaId),
  ]);
  const materiais = lerLinhas<{ id: string; quantidade_minima: number }>(
    materiaisR,
    "Não foi possível ler os materiais",
  );
  const avisosEstoque = lerLinhas<{ material_id: string; tipo: string; texto: string }>(
    avisosEstoqueR,
    "Não foi possível ler os avisos de estoque",
  );
  const lotesPorMaterial = new Map<string, Lote[]>();
  if (materiais.length > 0) {
    const lotesR = await admin
      .from("lotes_material")
      .select("id, material_id, quantidade, validade, criado_em")
      .in(
        "material_id",
        materiais.map((material) => material.id),
      );
    for (const linha of lerLinhas<{
      id: string;
      material_id: string;
      quantidade: number;
      validade: string;
      criado_em: string;
    }>(lotesR, "Não foi possível ler os lotes")) {
      const lote: Lote = {
        id: linha.id,
        materialId: linha.material_id,
        quantidade: linha.quantidade,
        validade: linha.validade.slice(0, 10),
        criadoEm: new Date(linha.criado_em).toISOString(),
      };
      lotesPorMaterial.set(linha.material_id, [...(lotesPorMaterial.get(linha.material_id) ?? []), lote]);
    }
  }
  const hoje = new Date();
  const abaixoDoMinimo = new Map<string, boolean>();
  for (const material of materiais) {
    const validos = lotesValidos(lotesPorMaterial.get(material.id) ?? [], hoje);
    abaixoDoMinimo.set(material.id, somarQuantidade(validos) < material.quantidade_minima);
  }
  const comAvisoMinimo = new Map<string, string>();
  for (const aviso of avisosEstoque) {
    if (aviso.tipo === "estoque_minimo") comAvisoMinimo.set(aviso.material_id, aviso.texto);
    if (aviso.tipo === "estoque_insuficiente") {
      desejos.push({
        tipo: "estoque_baixa_insuficiente",
        referenciaId: aviso.material_id,
        mensagem: aviso.texto,
        destinatarioIds: todos("estoque_baixa_insuficiente"),
        unico: true,
      });
    }
  }
  for (const material of materiais) {
    const abaixo = abaixoDoMinimo.get(material.id) === true;
    const texto = comAvisoMinimo.get(material.id);
    if (abaixo && texto !== undefined) {
      desejos.push({
        tipo: "estoque_abaixo_minimo",
        referenciaId: material.id,
        mensagem: texto,
        destinatarioIds: todos("estoque_abaixo_minimo"),
        unico: false,
      });
    } else if (!abaixo) {
      baixas.push({ tipo: "estoque_abaixo_minimo", referenciaId: material.id });
    }
  }

  // Próteses: aviso de atraso enquanto a etapa for envio_acompanhamento.
  const [avisosProteseR, protesesR] = await Promise.all([
    admin.from("avisos_protese").select("protese_id").eq("clinica_id", clinicaId),
    admin.from("proteses").select("id, etapa").eq("clinica_id", clinicaId),
  ]);
  const comAvisoProtese = new Set(
    lerLinhas<{ protese_id: string }>(avisosProteseR, "Não foi possível ler os avisos de prótese").map(
      (aviso) => aviso.protese_id,
    ),
  );
  for (const protese of lerLinhas<{ id: string; etapa: string }>(
    protesesR,
    "Não foi possível ler as próteses",
  )) {
    if (protese.etapa === "envio_acompanhamento") {
      if (comAvisoProtese.has(protese.id)) {
        desejos.push({
          tipo: "atraso_protese",
          referenciaId: protese.id,
          mensagem: MENSAGEM_PROTESE,
          destinatarioIds: todos("atraso_protese"),
          unico: false,
        });
      }
    } else {
      baixas.push({ tipo: "atraso_protese", referenciaId: protese.id });
    }
  }

  // Recepção: retorno a reagendar ou cancelamento a comunicar.
  const [avisosRecepcaoR, retornosR] = await Promise.all([
    admin
      .from("avisos_recepcao")
      .select("agendamento_id, motivo")
      .eq("clinica_id", clinicaId),
    admin
      .from("retornos")
      .select("id, status, agendamento_origem_id")
      .eq("clinica_id", clinicaId),
  ]);
  const retornos = lerLinhas<{ id: string; status: string; agendamento_origem_id: string }>(
    retornosR,
    "Não foi possível ler os retornos",
  );
  const retornoPorOrigem = new Map(retornos.map((retorno) => [retorno.agendamento_origem_id, retorno]));
  for (const retorno of retornos) {
    if (retorno.status === "reagendado") {
      baixas.push({ tipo: "retorno_reagendar", referenciaId: retorno.id });
    }
  }
  for (const aviso of lerLinhas<{ agendamento_id: string; motivo: string }>(
    avisosRecepcaoR,
    "Não foi possível ler os avisos da recepção",
  )) {
    if (aviso.motivo.includes(MOTIVO_RETORNO)) {
      const retorno = retornoPorOrigem.get(aviso.agendamento_id);
      if (!retorno || retorno.status === "reagendado") continue;
      desejos.push({
        tipo: "retorno_reagendar",
        referenciaId: retorno.id,
        mensagem: aviso.motivo,
        destinatarioIds: todos("retorno_reagendar"),
        unico: false,
      });
    } else {
      desejos.push({
        tipo: "cancelamento_comunicar",
        referenciaId: aviso.agendamento_id,
        mensagem: MENSAGEM_CANCELAMENTO,
        destinatarioIds: todos("cancelamento_comunicar"),
        unico: true,
      });
    }
  }

  // Resolve o que deixou de valer.
  for (const baixa of baixas) {
    if (!abertaPorReferencia.has(`${baixa.tipo}|${baixa.referenciaId}`)) continue;
    const { error } = await admin
      .from("notificacoes_internas")
      .update({ resolvida: true })
      .eq("clinica_id", clinicaId)
      .eq("tipo", baixa.tipo)
      .eq("referencia_id", baixa.referenciaId)
      .eq("resolvida", false);
    if (error) throw new ErroAplicacao("Não foi possível resolver a notificação", error);
  }

  // Publica o que falta, sem duplicar a aberta (e sem reabrir o aviso único).
  const deps: Dependencias = {
    notificacoes: porta,
    usuarios: { listarAtivos: async () => usuarios },
    ids: { novo: () => crypto.randomUUID() },
    agora: () => new Date().toISOString(),
  };
  for (const desejo of desejos) {
    const faltam = desejo.destinatarioIds.filter((destinatarioId) => {
      const chave = `${destinatarioId}|${desejo.tipo}|${desejo.referenciaId}`;
      return desejo.unico ? !qualquer.has(chave) : !aberta.has(chave);
    });
    if (faltam.length === 0) continue;
    await publicar(deps, {
      clinicaId,
      tipo: desejo.tipo,
      referenciaId: desejo.referenciaId,
      mensagem: desejo.mensagem,
      destinatarioIds: faltam,
    });
  }
}

export function criarNotificacoes(): Notificacoes {
  const porta = criarPorta();

  return {
    async listar(clinicaId, destinatarioId) {
      await sincronizar(clinicaId);
      return porta.listar(clinicaId, destinatarioId);
    },
    buscarAberta: porta.buscarAberta,
    salvar: porta.salvar,
    atualizar: porta.atualizar,
  };
}
