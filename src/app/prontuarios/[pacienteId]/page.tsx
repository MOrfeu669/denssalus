import Link from "next/link";
import { MENSAGEM_PAPEL } from "../../../domain/auth/tipos";
import { abrirProntuario, listarAuditoria } from "../../../domain/prontuario/casos";
import type { RegistroAuditoria } from "../../../domain/prontuario/tipos";
import { dependenciasProntuario } from "../../dependencias";
import { falha } from "../../falha";
import { sessaoAtual } from "../../sessao";
import { FormularioAnamnese, FormularioEvolucao } from "./form";
import { dataAgendamento } from "./formato";
import { Auditoria, Historico, VisaoGeral } from "./secoes";

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
