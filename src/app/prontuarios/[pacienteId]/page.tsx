import Link from "next/link";
import { MENSAGEM_PAPEL } from "../../../domain/auth/tipos";
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
import { FormularioAnamnese, FormularioEvolucao } from "./form";
import { SecaoDebitos } from "./debitos";
import { SecaoDocumentos, type DocumentoItem } from "./documentos";
import { rotuloStatus } from "../../agenda/rotulo";
import { dataAgendamento } from "./formato";
import { Odontograma } from "./odontograma";
import { carregarImagens } from "./carregar-imagens";
import { SecaoImagens } from "./imagens";
import { SecaoPlano } from "./plano";
import { carregarProteses } from "./carregar-proteses";
import { SecaoProteses } from "./proteses";
import { Auditoria, Historico, VisaoGeral } from "./secoes";
import type { ProcedimentoOpcao } from "./tipos-odontograma";

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
  const todosAgendamentos = historico.map(({ id, inicio, status }) => ({ id, inicio, status }));
  const agendamentosAbertos = historico
    .filter((item) => ["agendado", "em_espera", "iniciado"].includes(item.status))
    .map(({ id, inicio, status }) => ({ id, inicio, status }));

  return (
    <>
      <h1>Prontuário de {paciente.nome}</h1>
      <nav className="prontuario-nav" aria-label="Seções do prontuário">
        <a href="#visao-geral">Visão geral</a>
        {podeEscrever ? <a href="#anamnese">Anamnese</a> : null}
        <a href="#historico">Histórico</a>
        {podeEscrever ? <a href="#evolucoes">Evoluções</a> : null}
        {podeEscrever ? <a href="#odontograma">Odontograma</a> : null}
        {podeEscrever ? <a href="#plano">Plano de tratamento</a> : null}
        <a href="#debitos">Débitos</a>
        {podeEscrever ? <a href="#documentos">Documentos</a> : null}
        {podeEscrever ? <a href="#raio-x">Raio X e imagens</a> : null}
        <a href="#proteses">Próteses</a>
        {papel === "admin" ? <a href="#auditoria">Trilha de auditoria</a> : null}
      </nav>

      <VisaoGeral paciente={paciente} />

      {podeEscrever ? (
        <section className="prontuario-secao" aria-labelledby="anamnese">
          <h2 id="anamnese">Anamnese</h2>
          <FormularioAnamnese pacienteId={pacienteId} conteudo={anamnese?.conteudo ?? ""} />
          {anamnese ? null : <p>Nenhuma anamnese registrada.</p>}
        </section>
      ) : null}

      <Historico historico={historico} />

      {podeEscrever ? (
        <section className="prontuario-secao" aria-labelledby="evolucoes">
          <h2 id="evolucoes">Evoluções</h2>
          {consultas.length === 0 ? <p>Nenhuma consulta iniciada ou concluída.</p> : null}
          <ul className="lista">
            {consultas.map((consulta) => {
              const inicio = dataAgendamento(consulta.inicio);
              const atual = evolucoes.find((item) => item.agendamentoId === consulta.id);
              return (
                <li key={consulta.id}>
                  <span>
                    {inicio} · {rotuloStatus(consulta.status)}
                  </span>
                  <FormularioEvolucao
                    pacienteId={pacienteId}
                    agendamentoId={consulta.id}
                    rotulo={inicio}
                    texto={atual?.texto ?? ""}
                    materiais={atual ? undefined : materiaisDasConsultas.get(consulta.id)}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {podeEscrever ? (
        <section className="prontuario-secao" aria-labelledby="odontograma">
          <h2 id="odontograma">Odontograma</h2>
          {odontograma.ok ? (
            <Odontograma
              pacienteId={pacienteId}
              registros={odontograma.valor}
              procedimentos={procedimentos}
              agendamentos={todosAgendamentos}
              imagens={imagens.ok ? imagens.ativas : []}
              proteses={proteses.ok ? proteses.proteses : []}
              podeEscrever={podeEscrever}
            />
          ) : (
            <p role="alert" tabIndex={-1}>
              {odontograma.mensagem}
            </p>
          )}
        </section>
      ) : null}

      {podeEscrever ? (
        <section className="prontuario-secao" aria-labelledby="plano">
          <h2 id="plano">Plano de tratamento</h2>
          {planos.ok ? (
            <SecaoPlano
              pacienteId={pacienteId}
              planos={planos.valor}
              procedimentos={procedimentos}
              agendamentos={agendamentosAbertos}
              podeEscrever={podeEscrever}
            />
          ) : (
            <p role="alert" tabIndex={-1}>
              {planos.mensagem}
            </p>
          )}
        </section>
      ) : null}

      <section className="prontuario-secao" aria-labelledby="debitos">
        <h2 id="debitos">Débitos</h2>
        {debitos.ok ? (
          <SecaoDebitos pacienteId={pacienteId} debitos={debitos.valor} papel={papel} />
        ) : (
          <p role="alert" tabIndex={-1}>
            {debitos.mensagem}
          </p>
        )}
      </section>

      {podeEscrever ? (
        <section className="prontuario-secao" aria-labelledby="documentos">
          <h2 id="documentos">Documentos</h2>
          {documentos.ok ? (
            <SecaoDocumentos
              pacienteId={pacienteId}
              papel={papel}
              usuarioId={sessao.usuario.id}
              documentos={documentos.documentos}
              modelos={documentos.modelos}
              importados={documentos.importados}
            />
          ) : (
            <p role="alert" tabIndex={-1}>
              {documentos.mensagem}
            </p>
          )}
        </section>
      ) : null}

      {podeEscrever ? (
        <section className="prontuario-secao" aria-labelledby="raio-x">
          <h2 id="raio-x">Raio X e imagens</h2>
          {imagens.ok ? (
            <SecaoImagens
              pacienteId={pacienteId}
              ativas={imagens.ativas}
              pendentes={imagens.pendentes}
              agendamentos={todosAgendamentos}
              podeEscrever={podeEscrever}
            />
          ) : (
            <p role="alert" tabIndex={-1}>
              {imagens.mensagem}
            </p>
          )}
        </section>
      ) : null}

      <section className="prontuario-secao" aria-labelledby="proteses">
        <h2 id="proteses">Próteses</h2>
        {proteses.ok ? (
          <SecaoProteses
            pacienteId={pacienteId}
            proteses={proteses.proteses}
            responsaveis={proteses.responsaveis}
            procedimentos={procedimentos}
            agendamentos={agendamentosAbertos}
            papel={papel}
            limite={proteses.limite}
          />
        ) : (
          <p role="alert" tabIndex={-1}>
            {proteses.mensagem}
          </p>
        )}
      </section>

      {auditoria?.ok ? <Auditoria registros={auditoria.valor} /> : null}
      {auditoria && !auditoria.ok ? (
        <p role="alert" tabIndex={-1}>
          {auditoria.mensagem}
        </p>
      ) : null}

      <p className="nav">
        <Link href="/pacientes">Voltar</Link>
      </p>
    </>
  );
}
