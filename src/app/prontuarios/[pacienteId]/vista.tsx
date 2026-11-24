import type { ReactNode } from "react";
import type { Agendamento } from "../../../domain/agendamento/tipos";
import type { Papel } from "../../../domain/auth/tipos";
import type { DebitoComPagamento } from "../../../domain/debito/tipos";
import type { ModeloDocumento } from "../../../domain/documento/tipos";
import type { MaterialDaConsulta } from "../../../domain/estoque/tipos";
import type { RegistroOdontograma } from "../../../domain/odontograma/tipos";
import type { Paciente } from "../../../domain/paciente/tipos";
import type { PlanoComItens } from "../../../domain/plano/tipos";
import type { Anamnese, Evolucao, RegistroAuditoria } from "../../../domain/prontuario/tipos";
import { rotuloStatus, varianteStatus } from "../../agenda/rotulo";
import { Badge } from "@/components/ui/badge";
import { FormularioAnamnese, FormularioEvolucao } from "./form";
import { SecaoDebitos } from "./debitos";
import { SecaoDocumentos, type DocumentoItem } from "./documentos";
import { dataAgendamento } from "./formato";
import { Ficha, type AbaFicha } from "./ficha";
import {
  alertasDaAnamnese,
  canalPreferido,
  hrefAgendar,
  iniciais,
  linhaMeta,
  moeda,
  planoEmFoco,
  proximaConsulta,
  resumoFinanceiro,
  saldoDevedor,
  type ItemVisual,
} from "./ficha-dados";
import { carregarImagens } from "./carregar-imagens";
import { carregarProteses } from "./carregar-proteses";
import { LateralFicha } from "./lateral";
import { Odontograma } from "./odontograma";
import { SecaoImagens } from "./imagens";
import { SecaoPlano } from "./plano";
import { SecaoProteses } from "./proteses";
import { Auditoria, Historico, VisaoGeral } from "./secoes";
import type { AgendamentoOpcao, ProcedimentoOpcao } from "./tipos-odontograma";

type Resultado<T> = { ok: true; valor: T } | { ok: false; mensagem: string };

export function Vista({
  pacienteId,
  paciente,
  anamnese,
  historico,
  evolucoes,
  papel,
  usuarioId,
  podeEscrever,
  odontograma,
  procedimentos,
  planos,
  debitos,
  documentos,
  imagens,
  proteses,
  materiais,
  auditoria,
  nomes,
  agora,
}: {
  pacienteId: string;
  paciente: Paciente;
  anamnese: Anamnese | null;
  historico: Agendamento[];
  evolucoes: Evolucao[];
  papel: Papel;
  usuarioId: string;
  podeEscrever: boolean;
  odontograma: Resultado<RegistroOdontograma[]>;
  procedimentos: ProcedimentoOpcao[];
  planos: Resultado<PlanoComItens[]>;
  debitos: Resultado<DebitoComPagamento[]>;
  documentos:
    | { ok: true; documentos: DocumentoItem[]; modelos: ModeloDocumento[]; importados: string[] }
    | { ok: false; mensagem: string };
  imagens: Awaited<ReturnType<typeof carregarImagens>>;
  proteses: Awaited<ReturnType<typeof carregarProteses>>;
  materiais: Map<string, MaterialDaConsulta[]>;
  auditoria: { ok: true; valor: RegistroAuditoria[] } | { ok: false; mensagem: string } | null;
  nomes: { dentistas: Record<string, string>; cadeiras: Record<string, string> };
  agora: Date;
}) {
  const consultas = historico.filter((item) => item.status === "iniciado" || item.status === "concluido");
  const todosAgendamentos: AgendamentoOpcao[] = historico.map(({ id, inicio, status }) => ({ id, inicio, status }));
  const agendamentosAbertos = historico
    .filter((item) => ["agendado", "em_espera", "iniciado"].includes(item.status))
    .map(({ id, inicio, status }) => ({ id, inicio, status }));
  const alertas = alertasDaAnamnese(anamnese?.conteudo);
  const listaDebitos = debitos.ok ? debitos.valor : [];
  const saldo = saldoDevedor(listaDebitos);
  const plano = planos.ok ? planoEmFoco(planos.valor) : null;
  const itens: ItemVisual[] = (plano?.itens ?? []).map((item) => ({
    procedimentoNome: procedimentos.find((opcao) => opcao.id === item.procedimentoId)?.nome ?? "Procedimento",
    dentes: item.dentes,
    valor: item.valor,
    status: item.status,
    agendamentoId: item.agendamentoId,
  }));
  const financeiro = resumoFinanceiro(listaDebitos, podeEscrever && plano ? { itens } : null);
  const consulta = proximaConsulta(historico, agora);
  const abas: AbaFicha[] = [{ id: "visao-geral", rotulo: "Visão geral" }];
  const paineis: Record<string, ReactNode> = {
    "visao-geral": <VisaoGeral paciente={paciente} />,
  };

  if (podeEscrever) {
    abas.push({ id: "anamnese", rotulo: "Anamnese" });
    paineis.anamnese = (
      <section className="prontuario-secao" aria-labelledby="anamnese">
        <h2 id="anamnese">Anamnese</h2>
        <FormularioAnamnese pacienteId={pacienteId} conteudo={anamnese?.conteudo ?? ""} />
        {anamnese ? null : <p>Nenhuma anamnese registrada.</p>}
      </section>
    );
    abas.push({ id: "evolucoes", rotulo: "Evoluções", contagem: evolucoes.length });
    paineis.evolucoes = (
      <section className="prontuario-secao" aria-labelledby="evolucoes">
        <h2 id="evolucoes">Evoluções</h2>
        {consultas.length === 0 ? <p>Nenhuma consulta iniciada ou concluída.</p> : null}
        <ul className="lista">
          {consultas.map((item, indice) => {
            const inicio = dataAgendamento(item.inicio);
            const atual = evolucoes.find((evolucao) => evolucao.agendamentoId === item.id);
            return (
              <li key={item.id}>
                <span className="inline-flex flex-wrap items-center gap-2">
                  {inicio}
                  <Badge variant={varianteStatus(item.status)}>{rotuloStatus(item.status)}</Badge>
                </span>
                <FormularioEvolucao
                  pacienteId={pacienteId}
                  agendamentoId={item.id}
                  rotulo={inicio}
                  texto={atual?.texto ?? ""}
                  idTexto={indice === 0 ? "evolucao-texto" : undefined}
                  materiais={atual ? undefined : materiais.get(item.id)}
                />
              </li>
            );
          })}
        </ul>
      </section>
    );
    abas.push({ id: "odontograma", rotulo: "Odontograma" });
    paineis.odontograma = odontograma.ok ? (
      <Odontograma
        pacienteId={pacienteId}
        registros={odontograma.valor}
        procedimentos={procedimentos}
        agendamentos={todosAgendamentos}
        imagens={imagens.ok ? imagens.ativas : []}
        proteses={proteses.ok ? proteses.proteses : []}
        itensPlano={itens}
        podeEscrever={podeEscrever}
      />
    ) : (
      <p role="alert" tabIndex={-1}>
        {odontograma.mensagem}
      </p>
    );
    abas.push({ id: "plano", rotulo: "Plano de tratamento" });
    paineis.plano = (
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
          <Alerta mensagem={planos.mensagem} />
        )}
      </section>
    );
  }

  abas.push({
    id: "debitos",
    rotulo: "Débitos",
    contagem: listaDebitos.filter((item) => item.status === "em_aberto").length,
  });
  paineis.debitos = (
    <section className="prontuario-secao" aria-labelledby="debitos">
      <h2 id="debitos">Débitos</h2>
      {debitos.ok ? (
        <SecaoDebitos pacienteId={pacienteId} debitos={debitos.valor} papel={papel} />
      ) : (
        <Alerta mensagem={debitos.mensagem} />
      )}
    </section>
  );

  if (podeEscrever) {
    abas.push({ id: "documentos", rotulo: "Documentos" });
    paineis.documentos = (
      <section className="prontuario-secao" aria-labelledby="documentos">
        <h2 id="documentos">Documentos</h2>
        {documentos.ok ? (
          <SecaoDocumentos
            pacienteId={pacienteId}
            papel={papel}
            usuarioId={usuarioId}
            documentos={documentos.documentos}
            modelos={documentos.modelos}
            importados={documentos.importados}
          />
        ) : (
          <Alerta mensagem={documentos.mensagem} />
        )}
      </section>
    );
    abas.push({
      id: "raio-x",
      rotulo: "Raio X e imagens",
      contagem: imagens.ok ? imagens.ativas.length : undefined,
    });
    paineis["raio-x"] = (
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
          <Alerta mensagem={imagens.mensagem} />
        )}
      </section>
    );
  }

  abas.push({ id: "proteses", rotulo: "Próteses" });
  paineis.proteses = (
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
          laboratorios={proteses.laboratorios}
        />
      ) : (
        <Alerta mensagem={proteses.mensagem} />
      )}
    </section>
  );

  abas.push({ id: "historico", rotulo: "Histórico" });
  paineis.historico = <Historico historico={historico} />;

  if (papel === "admin") {
    abas.push({ id: "auditoria", rotulo: "Trilha de auditoria" });
    paineis.auditoria = auditoria?.ok ? (
      <Auditoria registros={auditoria.valor} />
    ) : (
      <Alerta mensagem={auditoria?.mensagem ?? "Não foi possível ler a trilha."} />
    );
  }

  return (
    <Ficha
      nome={paciente.nome}
      iniciaisNome={iniciais(paciente.nome)}
      meta={linhaMeta(paciente, agora)}
      responsavel={paciente.responsavel?.nome ?? null}
      canais={[...paciente.canais].sort((a, b) => Number(b.preferido) - Number(a.preferido))}
      alertas={alertas}
      debitoRotulo={saldo > 0 ? `Débito ${moeda(saldo)}` : null}
      podeEvoluir={podeEscrever}
      destinoAgenda={hrefAgendar(pacienteId)}
      abas={abas}
      inicial={podeEscrever ? "odontograma" : "visao-geral"}
      paineis={paineis}
      lateral={
        <LateralFicha
          alertas={alertas}
          consulta={consulta}
          nomes={{
            dentista: consulta ? (nomes.dentistas[consulta.dentistaId] ?? null) : null,
            cadeira: consulta ? (nomes.cadeiras[consulta.cadeiraId] ?? null) : null,
          }}
          procedimento={
            consulta?.procedimentoId
              ? (procedimentos.find((item) => item.id === consulta.procedimentoId)?.nome ?? null)
              : null
          }
          canal={canalPreferido(paciente)}
          agoraIso={agora.toISOString()}
          plano={plano ? { titulo: "Plano de tratamento", itens } : null}
          financeiro={financeiro}
          mostrarPlano={podeEscrever}
        />
      }
    />
  );
}

function Alerta({ mensagem }: { mensagem: string }) {
  return (
    <p role="alert" tabIndex={-1}>
      {mensagem}
    </p>
  );
}
