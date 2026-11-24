import Link from "next/link";
import { MENSAGEM_PAPEL } from "../../../domain/auth/tipos";
import { listarOpcoesAgendamento } from "../../../domain/agendamento/casos";
import { listarOdontograma } from "../../../domain/odontograma/casos";
import type { RegistroOdontograma } from "../../../domain/odontograma/tipos";
import { listarDebitos } from "../../../domain/debito/casos";
import type { DebitoComPagamento } from "../../../domain/debito/tipos";
import { listarDocumentos, listarModelos } from "../../../domain/documento/casos";
import type { ModeloDocumento } from "../../../domain/documento/tipos";
import { listarMateriaisDaConsulta } from "../../../domain/estoque/atendimento";
import type { MaterialDaConsulta } from "../../../domain/estoque/tipos";
import { listarPlanos } from "../../../domain/plano/casos";
import type { PlanoComItens } from "../../../domain/plano/tipos";
import { listarProcedimentos } from "../../../domain/procedimento/casos";
import { abrirProntuario, listarAuditoria } from "../../../domain/prontuario/casos";
import type { RegistroAuditoria } from "../../../domain/prontuario/tipos";
import {
  dependenciasAgendamento,
  dependenciasDebito,
  dependenciasDocumento,
  dependenciasEstoque,
  dependenciasOdontograma,
  dependenciasPlano,
  dependenciasProcedimento,
  dependenciasProntuario,
} from "../../dependencias";
import { falha } from "../../falha";
import { sessaoAtual } from "../../sessao";
import { CascaAberta } from "../../casca";
import "./tela.css";
import { type DocumentoItem } from "./documentos";
import { carregarImagens } from "./carregar-imagens";
import { carregarProteses } from "./carregar-proteses";
import type { ProcedimentoOpcao } from "./tipos-odontograma";
import { Vista } from "./vista";

type ResultadoOdontograma =
  | { ok: true; valor: RegistroOdontograma[] }
  | { ok: false; mensagem: string };

async function carregarOdontograma(
  sessao: NonNullable<Awaited<ReturnType<typeof sessaoAtual>>>,
  pacienteId: string,
): Promise<ResultadoOdontograma> {
  try {
    return await listarOdontograma(dependenciasOdontograma(), sessao, pacienteId);
  } catch (erro) {
    return falha(erro);
  }
}

type ResultadoPlanos =
  | { ok: true; valor: PlanoComItens[] }
  | { ok: false; mensagem: string };

async function carregarPlanos(
  sessao: NonNullable<Awaited<ReturnType<typeof sessaoAtual>>>,
  pacienteId: string,
): Promise<ResultadoPlanos> {
  try {
    return await listarPlanos(dependenciasPlano(), sessao, pacienteId);
  } catch (erro) {
    return falha(erro);
  }
}

type ResultadoDebitos =
  | { ok: true; valor: DebitoComPagamento[] }
  | { ok: false; mensagem: string };

async function carregarDebitos(
  sessao: NonNullable<Awaited<ReturnType<typeof sessaoAtual>>>,
  pacienteId: string,
): Promise<ResultadoDebitos> {
  try {
    return await listarDebitos(dependenciasDebito(), sessao, pacienteId);
  } catch (erro) {
    return falha(erro);
  }
}

type ResultadoDocumentos =
  | { ok: true; documentos: DocumentoItem[]; modelos: ModeloDocumento[]; importados: string[] }
  | { ok: false; mensagem: string };

async function carregarDocumentos(
  sessao: NonNullable<Awaited<ReturnType<typeof sessaoAtual>>>,
  pacienteId: string,
): Promise<ResultadoDocumentos> {
  try {
    const deps = dependenciasDocumento();
    const lista = await listarDocumentos(deps, sessao, pacienteId);
    if (!lista.ok) return lista;
    const modelos = await listarModelos(deps, sessao);
    if (!modelos.ok) return modelos;
    return {
      ok: true,
      documentos: lista.valor.map(({ id, modeloId, geradoEm, conteudoFinal }) => ({
        id,
        modeloId,
        geradoEm,
        conteudoFinal,
      })),
      modelos: modelos.valor.modelos,
      importados: modelos.valor.importados,
    };
  } catch (erro) {
    return falha(erro);
  }
}

async function carregarProcedimentos(
  sessao: NonNullable<Awaited<ReturnType<typeof sessaoAtual>>>,
): Promise<ProcedimentoOpcao[]> {
  try {
    const lista = await listarProcedimentos(dependenciasProcedimento(), sessao);
    return lista.ok ? lista.valor.map(({ id, nome }) => ({ id, nome })) : [];
  } catch {
    return [];
  }
}

async function carregarNomes(sessao: NonNullable<Awaited<ReturnType<typeof sessaoAtual>>>) {
  try {
    const opcoes = await listarOpcoesAgendamento(dependenciasAgendamento(), sessao);
    if (!opcoes.ok) return { dentistas: {}, cadeiras: {} };
    return {
      dentistas: Object.fromEntries(opcoes.valor.dentistas.map((item) => [item.id, item.nome])),
      cadeiras: Object.fromEntries(opcoes.valor.cadeiras.map((item) => [item.id, item.identificacao])),
    };
  } catch {
    return { dentistas: {}, cadeiras: {} };
  }
}

async function carregarMateriais(
  sessao: NonNullable<Awaited<ReturnType<typeof sessaoAtual>>>,
  agendamentoId: string,
): Promise<MaterialDaConsulta[]> {
  try {
    const lista = await listarMateriaisDaConsulta(
      dependenciasEstoque(),
      sessao,
      agendamentoId,
      new Date(),
    );
    return lista.ok ? lista.valor : [];
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ pacienteId: string }> }) {
  const { pacienteId } = await params;
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <CascaAberta>
        <h1>Prontuário</h1>
        <p className="casca-texto">Nenhuma sessão aberta.</p>
        <Link className="casca-botao" href="/login">
          Entrar
        </Link>
      </CascaAberta>
    );
  }

  const papel = sessao.usuario.papel;
  const podeEscrever = papel === "admin" || papel === "dentista";
  let resultado;
  let auditoria: { ok: true; valor: RegistroAuditoria[] } | { ok: false; mensagem: string } | null =
    null;
  try {
    const deps = dependenciasProntuario();
    resultado = await abrirProntuario(deps, sessao, pacienteId);
    if (resultado.ok && papel === "admin") {
      auditoria = await listarAuditoria(deps, sessao, pacienteId);
    }
  } catch (erro) {
    resultado = falha(erro);
  }
  if (!resultado.ok) {
    const semPermissao = resultado.mensagem === MENSAGEM_PAPEL;
    return (
      <>
        <h1>Prontuário</h1>
        <div className="casca-alerta" role="alert" tabIndex={-1}>
          <p>{resultado.mensagem}</p>
          <Link className="casca-botao" href={semPermissao ? "/pacientes" : `/prontuarios/${pacienteId}`}>
            {semPermissao ? "Voltar" : "Tentar de novo"}
          </Link>
        </div>
      </>
    );
  }

  const { paciente, anamnese, historico, evolucoes } = resultado.valor;
  const consultas = historico.filter((item) => item.status === "iniciado" || item.status === "concluido");
  const odontograma = await carregarOdontograma(sessao, pacienteId);
  const procedimentos = await carregarProcedimentos(sessao);
  const planos = await carregarPlanos(sessao, pacienteId);
  const debitos = await carregarDebitos(sessao, pacienteId);
  const documentos = await carregarDocumentos(sessao, pacienteId);
  const imagens = await carregarImagens(sessao, pacienteId);
  const proteses = await carregarProteses(sessao, pacienteId);
  const materiaisDasConsultas = new Map<string, MaterialDaConsulta[]>();
  if (podeEscrever) {
    for (const consulta of consultas) {
      if (evolucoes.some((item) => item.agendamentoId === consulta.id)) continue;
      materiaisDasConsultas.set(consulta.id, await carregarMateriais(sessao, consulta.id));
    }
  }
  const nomes = await carregarNomes(sessao);

  return (
    <Vista
      pacienteId={pacienteId}
      paciente={paciente}
      anamnese={anamnese}
      historico={historico}
      evolucoes={evolucoes}
      papel={papel}
      usuarioId={sessao.usuario.id}
      podeEscrever={podeEscrever}
      odontograma={odontograma}
      procedimentos={procedimentos}
      planos={planos}
      debitos={debitos}
      documentos={documentos}
      imagens={imagens}
      proteses={proteses}
      materiais={materiaisDasConsultas}
      auditoria={auditoria}
      nomes={nomes}
      agora={new Date()}
    />
  );
}
