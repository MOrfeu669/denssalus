import Link from "next/link";
import { MENSAGEM_PAPEL } from "../../../domain/auth/tipos";
import { listarOdontograma } from "../../../domain/odontograma/casos";
import type { RegistroOdontograma } from "../../../domain/odontograma/tipos";
import { listarDebitos } from "../../../domain/debito/casos";
import type { DebitoComPagamento } from "../../../domain/debito/tipos";
import { listarPlanos } from "../../../domain/plano/casos";
import type { PlanoComItens } from "../../../domain/plano/tipos";
import { listarProcedimentos } from "../../../domain/procedimento/casos";
import { abrirProntuario, listarAuditoria } from "../../../domain/prontuario/casos";
import type { RegistroAuditoria } from "../../../domain/prontuario/tipos";
import {
  dependenciasDebito,
  dependenciasOdontograma,
  dependenciasPlano,
  dependenciasProcedimento,
  dependenciasProntuario,
} from "../../dependencias";
import { falha } from "../../falha";
import { sessaoAtual } from "../../sessao";
import { FormularioAnamnese, FormularioEvolucao } from "./form";
import { SecaoDebitos } from "./debitos";
import { dataAgendamento } from "./formato";
import { Odontograma } from "./odontograma";
import { SecaoPlano } from "./plano";
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

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ pacienteId: string }> }) {
  const { pacienteId } = await params;
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <main>
        <h1>Prontuário</h1>
        <p>Nenhuma sessão aberta.</p>
      </main>
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
    return (
      <main>
        <h1>Prontuário</h1>
        <p role="alert" tabIndex={-1}>
          {resultado.mensagem}
        </p>
        <p className="nav">
          <Link href={`/prontuarios/${pacienteId}`}>Tentar de novo</Link>
          {" · "}
          <Link href="/pacientes">Voltar</Link>
        </p>
      </main>
    );
  }

  const { paciente, anamnese, historico, evolucoes } = resultado.valor;
  const consultas = historico.filter((item) => item.status === "iniciado" || item.status === "concluido");
  const odontograma = await carregarOdontograma(sessao, pacienteId);
  const procedimentos = await carregarProcedimentos(sessao);
  const planos = await carregarPlanos(sessao, pacienteId);
  const debitos = await carregarDebitos(sessao, pacienteId);
  const agendamentosAbertos = historico
    .filter((item) => ["agendado", "em_espera", "iniciado"].includes(item.status))
    .map(({ id, inicio, status }) => ({ id, inicio, status }));

  return (
    <main>
      <h1>Prontuário de {paciente.nome}</h1>
      <VisaoGeral paciente={paciente} />
      <Historico historico={historico} />

      <section aria-labelledby="anamnese">
        <h2 id="anamnese">Anamnese</h2>
        {podeEscrever ? (
          <FormularioAnamnese pacienteId={pacienteId} conteudo={anamnese?.conteudo ?? ""} />
        ) : (
          <>
            {anamnese ? <p>{anamnese.conteudo}</p> : <p>Nenhuma anamnese registrada.</p>}
            <p>{MENSAGEM_PAPEL}</p>
          </>
        )}
      </section>

      <section aria-labelledby="evolucoes">
        <h2 id="evolucoes">Evoluções</h2>
        {consultas.length === 0 ? <p>Nenhuma consulta iniciada ou concluída.</p> : null}
        <ul className="lista">
          {consultas.map((consulta) => {
            const inicio = dataAgendamento(consulta.inicio);
            const atual = evolucoes.find((item) => item.agendamentoId === consulta.id);
            return (
              <li key={consulta.id}>
                <span>
                  {inicio} · {consulta.status}
                </span>
                {podeEscrever ? (
                  <FormularioEvolucao
                    pacienteId={pacienteId}
                    agendamentoId={consulta.id}
                    rotulo={inicio}
                    texto={atual?.texto ?? ""}
                  />
                ) : (
                  <p>{atual ? atual.texto : "Nenhuma evolução registrada."}</p>
                )}
              </li>
            );
          })}
        </ul>
        {podeEscrever ? null : <p>{MENSAGEM_PAPEL}</p>}
      </section>

      <section aria-labelledby="odontograma">
        <h2 id="odontograma">Odontograma</h2>
        {odontograma.ok ? (
          <Odontograma
            pacienteId={pacienteId}
            registros={odontograma.valor}
            procedimentos={procedimentos}
            agendamentos={historico.map(({ id, inicio, status }) => ({ id, inicio, status }))}
            podeEscrever={podeEscrever}
          />
        ) : (
          <p role="alert" tabIndex={-1}>
            {odontograma.mensagem}
          </p>
        )}
      </section>

      <section aria-labelledby="plano">
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

      <section aria-labelledby="debitos">
        <h2 id="debitos">Débitos</h2>
        {debitos.ok ? (
          <SecaoDebitos pacienteId={pacienteId} debitos={debitos.valor} papel={papel} />
        ) : (
          <p role="alert" tabIndex={-1}>
            {debitos.mensagem}
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
    </main>
  );
}
