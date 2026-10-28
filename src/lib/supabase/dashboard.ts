import type { Dependencias } from "../../domain/dashboard/portas";
import type { CampoDashboard } from "../../domain/dashboard/tipos";
import type {
  Debito,
  FormaPagamento,
  OrigemDebito,
  Pagamento,
  StatusDebito,
} from "../../domain/debito/tipos";
import type { ItemPlano } from "../../domain/plano/tipos";
import type {
  EtapaProtese,
  PassagemProtese,
  Protese,
  StatusProtese,
} from "../../domain/protese/tipos";
import { createAdminClient } from "./admin";
import { criarAgendamentos } from "./agendamentos";
import { criarBloqueios } from "./bloqueios";
import { criarClinicas } from "./clinicas";
import { criarDentistas } from "./dentistas";
import { ErroAplicacao } from "./erro";
import { criarEstoque } from "./estoque";
import { criarProcedimentos } from "./procedimentos";

type Debitos = Dependencias["debitos"];
type Pagamentos = Dependencias["pagamentos"];
type Itens = Dependencias["itens"];
type Proteses = Dependencias["proteses"];
type Visibilidade = Dependencias["visibilidade"];
type Preferencias = Dependencias["preferencias"];

type LinhaItem = {
  id: string;
  plano_id: string;
  procedimento_id: string;
  dentes: number[];
  valor: number | string;
  agendamento_id: string | null;
  status: string;
  executado_por: string | null;
  concluido_em: string | null;
};

type LinhaDebito = {
  id: string;
  clinica_id: string;
  paciente_id: string;
  origem: string;
  item_plano_id: string | null;
  agendamento_id: string;
  valor: number | string;
  desconto: number | string;
  desconto_por: string | null;
  status: string;
};

type LinhaPagamento = {
  id: string;
  debito_id: string;
  forma: string;
  data: string;
  registrado_por: string;
};

type LinhaProtese = {
  id: string;
  clinica_id: string;
  paciente_id: string;
  dentes: number[];
  tipo: string;
  responsavel_id: string;
  laboratorio: string;
  procedimento_avaliacao_id: string | null;
  procedimento_cirurgia_id: string | null;
  agendamento_instalacao_id: string | null;
  etapa: string;
  status: string;
  prazo_retorno: string | null;
  ajuste_necessario: string | null;
  valor_comissao: number | string | null;
  alerta_atraso: boolean;
  historico: PassagemProtese[] | null;
};

const CAMPOS: readonly CampoDashboard[] = [
  "faturamento",
  "recebido",
  "despesa",
  "ocupacao",
  "estoque",
  "detalhe",
];

function soCampos(valores: string[] | null | undefined): CampoDashboard[] {
  return (valores ?? []).filter((valor): valor is CampoDashboard =>
    (CAMPOS as readonly string[]).includes(valor),
  );
}

function paraItem(linha: LinhaItem): ItemPlano {
  return {
    id: linha.id,
    planoId: linha.plano_id,
    procedimentoId: linha.procedimento_id,
    dentes: linha.dentes,
    valor: Number(linha.valor),
    agendamentoId: linha.agendamento_id,
    status: linha.status as ItemPlano["status"],
    executadoPor: linha.executado_por,
    concluidoEm: linha.concluido_em,
  };
}

function paraDebito(linha: LinhaDebito): Debito {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    pacienteId: linha.paciente_id,
    origem: linha.origem as OrigemDebito,
    itemPlanoId: linha.item_plano_id,
    agendamentoId: linha.agendamento_id,
    valor: Number(linha.valor),
    desconto: Number(linha.desconto),
    descontoPor: linha.desconto_por,
    status: linha.status as StatusDebito,
  };
}

function paraPagamento(linha: LinhaPagamento): Pagamento {
  return {
    id: linha.id,
    debitoId: linha.debito_id,
    forma: linha.forma as FormaPagamento,
    data: linha.data,
    registradoPor: linha.registrado_por,
  };
}

function paraProtese(linha: LinhaProtese): Protese {
  return {
    id: linha.id,
    clinicaId: linha.clinica_id,
    pacienteId: linha.paciente_id,
    dentes: linha.dentes,
    tipo: linha.tipo,
    responsavelId: linha.responsavel_id,
    laboratorio: linha.laboratorio,
    procedimentoAvaliacaoId: linha.procedimento_avaliacao_id ?? null,
    procedimentoCirurgiaId: linha.procedimento_cirurgia_id ?? null,
    agendamentoInstalacaoId: linha.agendamento_instalacao_id ?? null,
    etapa: linha.etapa as EtapaProtese,
    status: linha.status as StatusProtese,
    prazoRetorno: linha.prazo_retorno ? linha.prazo_retorno.slice(0, 10) : null,
    ajusteNecessario: linha.ajuste_necessario ?? null,
    valorComissao:
      linha.valor_comissao === null || linha.valor_comissao === undefined
        ? null
        : Number(linha.valor_comissao),
    alertaAtraso: linha.alerta_atraso,
    historico: linha.historico ?? [],
  } as Protese;
}

export function criarDashboard(): Omit<Dependencias, "ids"> {
  const admin = createAdminClient();
  const estoque = criarEstoque();

  const debitos: Debitos = {
    async listar(clinicaId) {
      const { data, error } = await admin.from("debitos").select("*").eq("clinica_id", clinicaId);
      if (error) throw new ErroAplicacao("Não foi possível listar os débitos", error);
      return (data as LinhaDebito[]).map(paraDebito);
    },
  };

  const pagamentos: Pagamentos = {
    async listarPorDebitos(debitoIds) {
      if (debitoIds.length === 0) return [];
      const { data, error } = await admin.from("pagamentos").select("*").in("debito_id", debitoIds);
      if (error) throw new ErroAplicacao("Não foi possível listar os pagamentos", error);
      return (data as LinhaPagamento[]).map(paraPagamento);
    },
  };

  const itens: Itens = {
    async listarPorClinica(clinicaId) {
      const { data, error } = await admin.from("itens_plano").select("*").eq("clinica_id", clinicaId);
      if (error) throw new ErroAplicacao("Não foi possível listar os itens do plano", error);
      return (data as LinhaItem[]).map(paraItem);
    },
  };

  const proteses: Proteses = {
    async listarPorClinica(clinicaId) {
      const { data, error } = await admin.from("proteses").select("*").eq("clinica_id", clinicaId);
      if (error) throw new ErroAplicacao("Não foi possível listar as próteses", error);
      return (data as LinhaProtese[]).map(paraProtese);
    },
  };

  const visibilidade: Visibilidade = {
    async buscar(clinicaId, papel) {
      const { data, error } = await admin
        .from("dashboard_visibilidade")
        .select("campos_ocultos")
        .eq("clinica_id", clinicaId)
        .eq("papel", papel)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler a visibilidade do dashboard", error);
      return data ? soCampos((data as { campos_ocultos: string[] }).campos_ocultos) : [];
    },

    async salvar(clinicaId, papel, campos) {
      const { error } = await admin
        .from("dashboard_visibilidade")
        .upsert(
          { clinica_id: clinicaId, papel, campos_ocultos: campos },
          { onConflict: "clinica_id,papel" },
        );
      if (error) throw new ErroAplicacao("Não foi possível salvar a visibilidade do dashboard", error);
    },
  };

  const preferencias: Preferencias = {
    async buscar(usuarioId) {
      const { data, error } = await admin
        .from("dashboard_preferencia")
        .select("widgets_ocultos, periodo")
        .eq("usuario_id", usuarioId)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler a preferência do dashboard", error);
      if (!data) return null;
      const linha = data as { widgets_ocultos: string[]; periodo: string };
      return { widgetsOcultos: soCampos(linha.widgets_ocultos), periodo: linha.periodo };
    },

    async salvar(usuarioId, widgetsOcultos, periodo) {
      const { error } = await admin
        .from("dashboard_preferencia")
        .upsert(
          { usuario_id: usuarioId, widgets_ocultos: widgetsOcultos, periodo },
          { onConflict: "usuario_id" },
        );
      if (error) throw new ErroAplicacao("Não foi possível salvar a preferência do dashboard", error);
    },
  };

  return {
    agendamentos: { listar: (clinicaId) => criarAgendamentos().listar(clinicaId) },
    bloqueios: { listar: (clinicaId) => criarBloqueios().listar(clinicaId) },
    debitos,
    pagamentos,
    itens,
    procedimentos: { listar: (clinicaId) => criarProcedimentos().listar(clinicaId) },
    proteses,
    materiais: { listar: (clinicaId) => estoque.materiais.listar(clinicaId) },
    lotes: { listarPorMaterial: (materialId) => estoque.lotes.listarPorMaterial(materialId) },
    dentistas: { listar: (clinicaId) => criarDentistas().listar(clinicaId) },
    clinicas: { buscarPorId: (id) => criarClinicas().buscarPorId(id) },
    visibilidade,
    preferencias,
  };
}
