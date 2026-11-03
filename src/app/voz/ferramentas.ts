// Sem "use server": este arquivo NÃO é exposto como Server Action. Só `actions.ts` o importa.
import {
  cancelarAgendamento,
  criarAgendamento,
  criarBloqueio,
  iniciarAtendimento,
  listarOpcoesAgendamento,
  marcarChegada,
  verAgenda,
} from "../../domain/agendamento/casos";
import { sugerirFim } from "../../domain/agendamento/regras";
import type { Resultado, Sessao } from "../../domain/auth/tipos";
import { criarMaterial, historico, listarMateriais, reabastecer, vincularMaterial } from "../../domain/estoque/casos";
import { cadastrarPaciente, listarPacientes } from "../../domain/paciente/casos";
import type { CanalComunicacao } from "../../domain/paciente/tipos";
import { dependenciasAgendamento, dependenciasEstoque, dependenciasPaciente } from "../dependencias";

export type SaidaVoz = { ok: true; dados: unknown } | { ok: false; mensagem: string };
type Params = Record<string, unknown>;
type Ferramenta = (sessao: Sessao, p: Params) => Promise<SaidaVoz>;

const FORMATO_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const FORMATO_DIA = /^\d{4}-\d{2}-\d{2}$/;
const MENSAGEM_HORARIO = "Informe um horário válido";

const texto = (v: unknown) => String(v ?? "").trim();
const sem = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const hora = (instante: string) => instante.slice(11, 16); // mesma leitura de `horaDe` na grade
const dia = (instante: string) => instante.slice(0, 10);

function ok(dados: unknown): SaidaVoz {
  return { ok: true, dados };
}
function erro(mensagem: string): SaidaVoz {
  return { ok: false, mensagem };
}
function de<T>(r: Resultado<T>, mapa: (valor: T) => unknown): SaidaVoz {
  return r.ok ? ok(mapa(r.valor)) : erro(r.mensagem);
}

/** Dentistas, cadeiras e procedimentos ativos. Usa o caso que qualquer papel pode chamar (agendamento:criar). */
async function opcoesAtivas(sessao: Sessao) {
  const deps = dependenciasAgendamento();
  const r = await listarOpcoesAgendamento(deps, sessao);
  if (!r.ok) return r;
  const clinicaId = sessao.usuario.clinicaId;
  const [cadeiras, dentistas] = await Promise.all([deps.cadeiras.listar(clinicaId), deps.dentistas.listar(clinicaId)]);
  const cadeirasAtivas = new Set(cadeiras.filter((c) => c.ativa).map((c) => c.id));
  const dentistasAtivos = new Set(dentistas.filter((d) => d.ativo).map((d) => d.id));
  return {
    ok: true as const,
    valor: {
      dentistas: r.valor.dentistas.filter((d) => dentistasAtivos.has(d.id)),
      cadeiras: r.valor.cadeiras.filter((c) => cadeirasAtivas.has(c.id)),
      procedimentos: r.valor.procedimentos,
    },
  };
}

function horarioLocal(valor: unknown): string | null {
  const t = texto(valor);
  return FORMATO_LOCAL.test(t) ? t : null;
}

export const FERRAMENTAS: Record<string, Ferramenta> = {
  // ---------- leitura (devolve só o necessário: sem CPF, endereço nem contatos) ----------
  async buscar_paciente(sessao, p) {
    const busca = sem(texto(p.busca));
    if (!busca) return erro("Informe o nome do paciente");
    const r = await listarPacientes(dependenciasPaciente(), sessao);
    return de(r, (lista) =>
      lista
        .filter((x) => sem(x.nome).includes(busca))
        .slice(0, 8)
        .map((x) => ({ id: x.id, nome: x.nome, ano_nascimento: x.dataNascimento?.slice(0, 4) ?? null })),
    );
  },

  async listar_dentistas(sessao) {
    return de(await opcoesAtivas(sessao), (o) => o.dentistas.map(({ id, nome }) => ({ id, nome })));
  },

  async listar_cadeiras(sessao) {
    return de(await opcoesAtivas(sessao), (o) => o.cadeiras);
  },

  async listar_procedimentos(sessao) {
    return de(await opcoesAtivas(sessao), (o) =>
      o.procedimentos.map((x) => ({ id: x.id, nome: x.nome, duracao_minutos: x.tempoMedioMinutos })),
    );
  },

  async ver_clinica(sessao) {
    const clinica = await dependenciasAgendamento().clinicas.buscarPorId(sessao.usuario.clinicaId);
    if (!clinica) return erro("Clínica não encontrada");
    return ok({
      nome: clinica.nome,
      dias_atendimento: clinica.diasAtendimento,
      horario_abertura: clinica.horarioAbertura,
      horario_fechamento: clinica.horarioFechamento,
    });
  },

  /** Agenda de um dia (YYYY-MM-DD), opcionalmente de um dentista. */
  async ver_agenda(sessao, p) {
    const data = texto(p.data);
    if (!FORMATO_DIA.test(data)) return erro("Informe a data no formato AAAA-MM-DD");
    const deps = dependenciasAgendamento();
    const grade = await verAgenda(deps, sessao, { data, dentistaId: texto(p.dentista_id) || null, cadeiraId: null });
    if (!grade.ok) return erro(grade.mensagem);

    const clinicaId = sessao.usuario.clinicaId;
    const [pacientes, dentistas, cadeiras] = await Promise.all([
      deps.pacientes.listar(clinicaId),
      deps.dentistas.listar(clinicaId),
      deps.cadeiras.listar(clinicaId),
    ]);
    const nome = (l: { id: string }[], campo: string) =>
      new Map(l.map((x) => [x.id, String((x as Record<string, unknown>)[campo])]));
    const nPac = nome(pacientes, "nome");
    const nDen = nome(dentistas, "nome");
    const nCad = nome(cadeiras, "identificacao");

    return ok({
      data,
      abertura: grade.valor.horarioAbertura,
      fechamento: grade.valor.horarioFechamento,
      agendamentos: grade.valor.agendamentos
        .filter((a) => dia(a.inicio) === data)
        .map((a) => ({
          id: a.id,
          inicio: hora(a.inicio),
          fim: hora(a.fim),
          paciente: nPac.get(a.pacienteId),
          dentista: nDen.get(a.dentistaId),
          cadeira: nCad.get(a.cadeiraId),
          status: a.status,
          alerta: a.alerta ? (a.textoAlerta ?? "atenção") : null,
        })),
      bloqueios: grade.valor.bloqueios
        .filter((b) => dia(b.inicio) === data)
        .map((b) => ({ dentista: nDen.get(b.dentistaId), inicio: hora(b.inicio), fim: hora(b.fim), motivo: b.motivo })),
    });
  },

  // ---------- estoque: leitura ----------
  /** Saldo por material (só lotes válidos). Como na tela, ler também baixa lotes vencidos e gera avisos de mínimo. */
  async consultar_estoque(sessao, p) {
    const busca = sem(texto(p.busca));
    const apenasBaixos = p.apenas_baixos === true || texto(p.apenas_baixos).toLowerCase() === "true";
    const r = await listarMateriais(dependenciasEstoque(), sessao, new Date());
    return de(r, (lista) =>
      lista
        .filter((m) => !busca || sem(m.nome).includes(busca))
        .map((m) => ({
          id: m.id,
          nome: m.nome,
          quantidade: m.quantidade,
          quantidade_minima: m.quantidadeMinima,
          abaixo_do_minimo: m.quantidade < m.quantidadeMinima,
        }))
        .filter((m) => !apenasBaixos || m.abaixo_do_minimo),
    );
  },

  /** Últimas 10 movimentações (entrada, baixa, vencimento), da mais recente para a mais antiga. */
  async historico_material(sessao, p) {
    const r = await historico(dependenciasEstoque(), sessao, texto(p.material_id), new Date());
    return de(r, (lista) =>
      lista
        .slice(-10)
        .reverse()
        .map((m) => ({ tipo: m.tipo, quantidade: m.quantidade, data: dia(m.registradoEm) })),
    );
  },

  // ---------- escrita (o botão só chama depois de o usuário confirmar na tela) ----------
  /** NÃO existe tool de emergência: ela ignora as validações de horário e fica só na tela. */
  async criar_agendamento(sessao, p) {
    const inicio = horarioLocal(p.inicio);
    if (!inicio) return erro(MENSAGEM_HORARIO);
    const procedimentoId = texto(p.procedimento_id);

    let duracao = Number(p.duracao_minutos);
    if (!(duracao > 0) && procedimentoId) {
      const o = await opcoesAtivas(sessao);
      if (!o.ok) return erro(o.mensagem);
      duracao = o.valor.procedimentos.find((x) => x.id === procedimentoId)?.tempoMedioMinutos ?? 0;
    }
    if (!(duracao > 0)) return erro("Informe a duração ou o procedimento");

    const r = await criarAgendamento(dependenciasAgendamento(), sessao, {
      pacienteId: texto(p.paciente_id),
      dentistaId: texto(p.dentista_id),
      cadeiraId: texto(p.cadeira_id),
      procedimentoId: procedimentoId || null,
      inicio,
      fim: sugerirFim(inicio, duracao),
    });
    return de(r, (a) => ({ id: a.id, data: dia(a.inicio), inicio: hora(a.inicio), fim: hora(a.fim), status: a.status }));
  },

  async marcar_chegada(sessao, p) {
    const r = await marcarChegada(dependenciasAgendamento(), sessao, texto(p.id));
    return de(r, (a) => ({ id: a.id, status: a.status }));
  },

  async iniciar_atendimento(sessao, p) {
    const r = await iniciarAtendimento(dependenciasAgendamento(), sessao, texto(p.id));
    return de(r, (a) => ({ id: a.id, status: a.status }));
  },

  /** Sempre `confirmouReversao = false`: se houver registro no odontograma a mensagem manda concluir pela tela. */
  async cancelar_agendamento(sessao, p) {
    const r = await cancelarAgendamento(dependenciasAgendamento(), sessao, texto(p.id), texto(p.motivo), new Date(), false);
    return de(r, (a) => ({ id: a.id, status: a.status }));
  },

  async criar_bloqueio(sessao, p) {
    const inicio = horarioLocal(p.inicio);
    const fim = horarioLocal(p.fim);
    if (!inicio || !fim) return erro(MENSAGEM_HORARIO);
    const r = await criarBloqueio(dependenciasAgendamento(), sessao, {
      dentistaId: texto(p.dentista_id),
      inicio,
      fim,
      motivo: texto(p.motivo) || null,
    });
    return de(r, (b) => ({ id: b.id, inicio: hora(b.inicio), fim: hora(b.fim) }));
  },

  /** Simplificado para voz: WhatsApp e/ou e-mail (o primeiro informado é o preferido). Menor de idade: concluir pela tela. */
  async cadastrar_paciente(sessao, p) {
    const contatos: [CanalComunicacao["canal"], string][] = [
      ["whatsapp", texto(p.whatsapp)],
      ["email", texto(p.email)],
    ];
    const canais: CanalComunicacao[] = contatos
      .filter(([, contato]) => contato !== "")
      .map(([canal, contato], i) => ({ canal, contato, preferido: i === 0 }));
    const r = await cadastrarPaciente(
      dependenciasPaciente(),
      sessao,
      { nome: texto(p.nome), canais, dataNascimento: texto(p.data_nascimento) || null },
      new Date(),
    );
    return r.ok ? ok({ id: r.valor.id, nome: r.valor.nome }) : erro(r.mensagem);
  },
  // ---------- estoque: escrita ----------
  /** Não existe baixa manual: a baixa é automática (FEFO) ao concluir o atendimento, pelos materiais vinculados ao procedimento. */
  async cadastrar_material(sessao, p) {
    const r = await criarMaterial(
      dependenciasEstoque(),
      sessao,
      {
        nome: texto(p.nome),
        quantidade: Number(p.quantidade),
        quantidadeMinima: Number(p.quantidade_minima),
        validade: texto(p.validade),
      },
      new Date(),
    );
    return de(r, (m) => ({ id: m.id, nome: m.nome }));
  },

  async reabastecer_material(sessao, p) {
    const r = await reabastecer(
      dependenciasEstoque(),
      sessao,
      texto(p.material_id),
      { quantidade: Number(p.quantidade), validade: texto(p.validade) },
      new Date(),
    );
    return de(r, (l) => ({ quantidade_adicionada: l.quantidade, validade: l.validade }));
  },

  async vincular_material_procedimento(sessao, p) {
    const r = await vincularMaterial(dependenciasEstoque(), sessao, {
      procedimentoId: texto(p.procedimento_id),
      materialId: texto(p.material_id),
      quantidade: Number(p.quantidade),
    });
    return de(r, (v) => ({ material_id: v.materialId, procedimento_id: v.procedimentoId, quantidade_por_atendimento: v.quantidade }));
  },
};

export const ESCRITA = new Set([
  "criar_agendamento",
  "marcar_chegada",
  "iniciar_atendimento",
  "cancelar_agendamento",
  "criar_bloqueio",
  "cadastrar_paciente",
  "cadastrar_material",
  "reabastecer_material",
  "vincular_material_procedimento",
]);
export const LEITURA = Object.keys(FERRAMENTAS).filter((nome) => !ESCRITA.has(nome));