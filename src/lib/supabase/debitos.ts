import type { Debitos, Pagamentos } from "../../domain/debito/portas";
import type {
  Debito,
  FormaPagamento,
  OrigemDebito,
  Pagamento,
  StatusDebito,
} from "../../domain/debito/tipos";
import { createAdminClient } from "./admin";
import { ErroAplicacao } from "./erro";

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

function paraLinhaDebito(debito: Debito): LinhaDebito {
  return {
    id: debito.id,
    clinica_id: debito.clinicaId,
    paciente_id: debito.pacienteId,
    origem: debito.origem,
    item_plano_id: debito.itemPlanoId,
    agendamento_id: debito.agendamentoId,
    valor: debito.valor,
    desconto: debito.desconto,
    desconto_por: debito.descontoPor,
    status: debito.status,
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

function paraLinhaPagamento(pagamento: Pagamento): LinhaPagamento {
  return {
    id: pagamento.id,
    debito_id: pagamento.debitoId,
    forma: pagamento.forma,
    data: pagamento.data,
    registrado_por: pagamento.registradoPor,
  };
}

export function criarDebitos(): { debitos: Debitos; pagamentos: Pagamentos } {
  const admin = createAdminClient();

  const debitos: Debitos = {
    async listarPorPaciente(clinicaId, pacienteId) {
      const { data, error } = await admin
        .from("debitos")
        .select("*")
        .eq("clinica_id", clinicaId)
        .eq("paciente_id", pacienteId);
      if (error) throw new ErroAplicacao("Não foi possível listar os débitos", error);
      return (data as LinhaDebito[]).map(paraDebito);
    },

    async listarPorAgendamento(clinicaId, agendamentoId) {
      const { data, error } = await admin
        .from("debitos")
        .select("*")
        .eq("clinica_id", clinicaId)
        .eq("agendamento_id", agendamentoId);
      if (error) throw new ErroAplicacao("Não foi possível listar os débitos do agendamento", error);
      return (data as LinhaDebito[]).map(paraDebito);
    },

    async buscarPorId(id) {
      const { data, error } = await admin
        .from("debitos")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível ler o débito", error);
      return data ? paraDebito(data as LinhaDebito) : null;
    },

    async salvar(debito) {
      const { error } = await admin
        .from("debitos")
        .upsert(paraLinhaDebito(debito), { onConflict: "id" });
      if (error) throw new ErroAplicacao("Não foi possível salvar o débito", error);
    },
  };

  const pagamentos: Pagamentos = {
    async listarPorDebitos(debitoIds) {
      if (debitoIds.length === 0) return [];
      const { data, error } = await admin
        .from("pagamentos")
        .select("*")
        .in("debito_id", debitoIds);
      if (error) throw new ErroAplicacao("Não foi possível listar os pagamentos", error);
      return (data as LinhaPagamento[]).map(paraPagamento);
    },

    async salvar(pagamento) {
      const { error } = await admin.from("pagamentos").insert(paraLinhaPagamento(pagamento));
      if (error) throw new ErroAplicacao("Não foi possível registrar o pagamento", error);
    },
  };

  return { debitos, pagamentos };
}
