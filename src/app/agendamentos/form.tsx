"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ouvirOverlay, type DestinoOverlay, type SlotNovo } from "./pedido";
import type { Papel } from "../../domain/auth/tipos";
import { sugerirFim } from "../../domain/agendamento/regras";
import type { Agendamento, OpcoesAgendamento } from "../../domain/agendamento/tipos";
import { MENSAGEM_REGISTROS_CONFIRMADOS } from "../../domain/odontograma/tipos";
import { rotuloStatus, varianteStatus } from "../agenda/rotulo";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { bloquear, cancelar, chegar, criar, emergencia, iniciar } from "./actions";
import { marcar } from "../retornos/actions";
import { registrarEvolucao } from "../prontuarios/[pacienteId]/actions";
import { FormularioMarcarRetorno } from "../retornos/form";
import { Alerta } from "./alerta";
import { FormularioCancelar, PerguntaReagendar, podeCancelar } from "./cancelar";
import { FormularioEvolucao, podeEvoluir } from "./evolucao";
import {
  intervaloLegivel,
  PENDENTE_BLOQUEAR,
  PENDENTE_CHEGADA,
  PENDENTE_CRIAR,
  PENDENTE_EMERGENCIA,
  PENDENTE_INICIAR,
  ROTULO_BLOQUEAR,
  ROTULO_CHEGADA,
  ROTULO_CRIAR,
  ROTULO_EMERGENCIA,
  ROTULO_INICIAR,
  rotuloDoBotao,
  VAZIO_AGENDAMENTOS,
} from "./texto";

export type ValoresIniciais = {
  pacienteId: string;
  dentistaId: string;
  procedimentoId: string;
};

export function Agendamentos({
  agendamentos,
  opcoes,
  papel,
  usuarioId,
  inicial,
}: {
  agendamentos: Agendamento[];
  opcoes: OpcoesAgendamento;
  papel: Papel;
  usuarioId: string;
  inicial: ValoresIniciais;
}) {
  const roteador = useRouter();
  const [criacao, acaoCriar, pendenteCriar] = useActionState(criar, estadoVazio);
  const [emergenciaEstado, acaoEmergencia, pendenteEmergencia] = useActionState(emergencia, estadoVazio);
  const [atendimento, acaoIniciar, pendenteIniciar] = useActionState(iniciar, estadoVazio);
  const [chegada, acaoChegar, pendenteChegar] = useActionState(chegar, estadoVazio);
  const [bloqueio, acaoBloquear, pendenteBloquear] = useActionState(bloquear, estadoVazio);
  const [cancelamento, acaoCancelar, pendenteCancelar] = useActionState(cancelar, estadoVazio);
  const [retorno, acaoRetorno, pendenteRetorno] = useActionState(marcar, estadoVazio);
  const [evolucao, acaoEvolucao, pendenteEvolucao] = useActionState(registrarEvolucao, estadoVazio);
  const aviso = avisoVisivel(
    criacao,
    emergenciaEstado,
    atendimento,
    chegada,
    bloqueio,
    retorno,
    evolucao,
    ...(cancelamento.status === "erro" && cancelamento.mensagem !== MENSAGEM_REGISTROS_CONFIRMADOS
      ? [{ ...cancelamento, detalhe: "" }]
      : []),
  );
  const podeBloquear = papel === "admin" || papel === "dentista";
  const ocupado =
    pendenteCriar ||
    pendenteEmergencia ||
    pendenteIniciar ||
    pendenteChegar ||
    pendenteBloquear ||
    pendenteCancelar ||
    pendenteRetorno ||
    pendenteEvolucao;
  const [aberto, setAberto] = useState(false);
  const [destino, setDestino] = useState<DestinoOverlay | null>(null);
  const [slot, setSlot] = useState<SlotNovo | null>(null);
  const origemRef = useRef<HTMLElement | null>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preenchido = Boolean(inicial.pacienteId || inicial.procedimentoId);
    if (preenchido || window.location.hash.length > 1) setAberto(true);
    function aoHash() {
      if (window.location.hash.length <= 1) return;
      setDestino(null);
      setSlot(null);
      setAberto(true);
      const id = window.location.hash.slice(1);
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ block: "nearest" });
      });
    }
    window.addEventListener("hashchange", aoHash);
    return () => window.removeEventListener("hashchange", aoHash);
  }, [inicial]);

  useEffect(() => ouvirOverlay((pedido) => {
    origemRef.current = pedido.origem;
    setDestino(pedido.destino);
    setSlot(pedido.destino === "novo" ? pedido.slot ?? null : null);
    setAberto(true);
  }), []);

  useEffect(() => {
    if (!aberto || destino) return;
    const id = window.location.hash.slice(1);
    if (!id) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [aberto, destino, agendamentos]);

  useEffect(() => {
    if (!aberto) return;
    const id = destino === "novo" ? "agendamentos-novo" : destino === "bloquear" ? "agendamentos-bloqueio" : "";
    const frame = requestAnimationFrame(() => {
      const alvo = id ? document.getElementById(id) : null;
      const painel = painelRef.current;
      if (alvo && painel) {
        const topo = alvo.getBoundingClientRect().top - painel.getBoundingClientRect().top + painel.scrollTop;
        painel.scrollTo({ top: Math.max(topo - 8, 0) });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [aberto, destino]);

  function aoMudar(proximo: boolean, detalhes: { cancel: () => void }) {
    if (proximo) return;
    if (ocupado) {
      detalhes.cancel();
      return;
    }
    setAberto(false);
    setDestino(null);
    setSlot(null);
  }

  useEffect(() => {
    if (
      [criacao, emergenciaEstado, atendimento, chegada, bloqueio, cancelamento, retorno, evolucao].some(
        (item) => item.status === "sucesso",
      )
    ) {
      roteador.refresh();
    }
  }, [criacao, emergenciaEstado, atendimento, chegada, bloqueio, cancelamento, retorno, evolucao, roteador]);

  const sucesso = aviso.status === "sucesso";

  return (
    <Dialog open={aberto} onOpenChange={aoMudar} disablePointerDismissal={ocupado}>
      <DialogContent
        ref={painelRef}
        showCloseButton={false}
        finalFocus={() => origemRef.current}
        className="max-h-[calc(100vh-3rem)] overflow-y-auto sm:max-w-3xl"
      >
        <DialogHeader className="flex-row items-start justify-between pr-0">
          <div className="flex flex-col gap-2">
            <DialogTitle id="agendamentos-titulo">Agendamentos</DialogTitle>
            <DialogDescription>
              Crie um horário, bloqueie a agenda ou acompanhe os atendimentos da clínica.
            </DialogDescription>
          </div>
          <DialogClose className={buttonVariants({ variant: "outline", className: "h-8 shrink-0" })}>
            Fechar
          </DialogClose>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <Alerta
            tipo={sucesso ? "sucesso" : "erro"}
            mensagem={aviso.mensagem}
            quando={aviso.quando}
            classe={
              sucesso
                ? "rounded-paper-md border border-ok bg-ok-fundo px-4 py-3 text-sm font-semibold text-ok-tinta outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-destaque"
                : "rounded-paper-md border border-perigo bg-perigo-fundo px-4 py-3 text-sm font-semibold text-perigo-tinta outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-perigo"
            }
          />
          <PerguntaReagendar estado={cancelamento} agendamentos={agendamentos} />

          <section className="flex flex-col gap-4 rounded-paper-md border border-borda-papel bg-papel p-4" aria-labelledby="agendamentos-novo">
            <h2 id="agendamentos-novo" className="m-0 font-heading text-lg leading-6 font-semibold text-tinta">
              Novo agendamento
            </h2>
            <form
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              key={`${criacao.status === "sucesso" ? criacao.quando : 0}|${inicial.pacienteId}|${inicial.dentistaId}|${inicial.procedimentoId}|${slot?.inicio ?? ""}|${slot?.dentistaId ?? ""}|${slot?.cadeiraId ?? ""}`}
              action={acaoCriar}
              aria-busy={pendenteCriar || pendenteEmergencia}
            >
              <CamposCriar opcoes={opcoes} inicial={inicial} slot={slot} />
              <div className="col-span-full flex flex-wrap gap-3">
                <Button type="submit" className="h-10" disabled={pendenteCriar || pendenteEmergencia}>
                  {rotuloDoBotao(ROTULO_CRIAR, PENDENTE_CRIAR, pendenteCriar)}
                </Button>
                {papel === "recepcionista" ? null : (
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-10"
                    formAction={acaoEmergencia}
                    disabled={pendenteCriar || pendenteEmergencia}
                  >
                    {rotuloDoBotao(ROTULO_EMERGENCIA, PENDENTE_EMERGENCIA, pendenteEmergencia)}
                  </Button>
                )}
              </div>
            </form>
          </section>

          {podeBloquear ? (
            <section className="flex flex-col gap-4 rounded-paper-md border border-borda-papel bg-papel p-4" aria-labelledby="agendamentos-bloqueio">
              <h2 id="agendamentos-bloqueio" className="m-0 font-heading text-lg leading-6 font-semibold text-tinta">
                Bloqueio de agenda
              </h2>
              <form
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                key={bloqueio.status === "sucesso" ? bloqueio.quando : 0}
                action={acaoBloquear}
                aria-busy={pendenteBloquear}
              >
                <DentistaDoBloqueio papel={papel} usuarioId={usuarioId} dentistas={opcoes.dentistas} />
                <CampoRotulo rotulo="Início">
                  <Input name="inicio" type="datetime-local" required />
                </CampoRotulo>
                <CampoRotulo rotulo="Fim">
                  <Input name="fim" type="datetime-local" required />
                </CampoRotulo>
                <CampoRotulo rotulo="Repetição">
                  <NativeSelect name="frequencia" defaultValue="pontual">
                    <NativeSelectOption value="pontual">Só este horário</NativeSelectOption>
                    <NativeSelectOption value="diaria">Todo dia</NativeSelectOption>
                    <NativeSelectOption value="semanal">Toda semana</NativeSelectOption>
                  </NativeSelect>
                </CampoRotulo>
                <CampoRotulo rotulo="Até">
                  <Input name="dataFim" type="date" />
                </CampoRotulo>
                <CampoRotulo rotulo="Motivo">
                  <Input name="motivo" />
                </CampoRotulo>
                <div className="col-span-full">
                  <Button type="submit" className="h-10" disabled={pendenteBloquear}>
                    {rotuloDoBotao(ROTULO_BLOQUEAR, PENDENTE_BLOQUEAR, pendenteBloquear)}
                  </Button>
                </div>
              </form>
            </section>
          ) : null}

          <section className="flex flex-col gap-4" aria-labelledby="agendamentos-lista">
            <h2 id="agendamentos-lista" className="m-0 font-heading text-lg leading-6 font-semibold text-tinta">
              Agendamentos da clínica
            </h2>
            {agendamentos.length === 0 ? (
              <p className="m-0 text-base leading-6 text-apagado">{VAZIO_AGENDAMENTOS}</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {agendamentos.map((agendamento) => (
                  <li
                    id={agendamento.id}
                    key={agendamento.id}
                    className="flex flex-col gap-3 rounded-paper-md border border-borda-papel bg-card p-4 shadow-paper-sm"
                  >
                    <ResumoAgendamento agendamento={agendamento} opcoes={opcoes} />
                    <div className="flex flex-wrap items-end gap-3">
                      {agendamento.status === "agendado" ? (
                        <form action={acaoChegar} aria-busy={pendenteChegar}>
                          <input type="hidden" name="id" value={agendamento.id} />
                          <Button type="submit" variant="outline" className="h-9" disabled={pendenteChegar}>
                            {rotuloDoBotao(ROTULO_CHEGADA, PENDENTE_CHEGADA, pendenteChegar)}
                          </Button>
                        </form>
                      ) : null}
                      {podeIniciar(agendamento, papel, usuarioId, opcoes.dentistas) ? (
                        <form action={acaoIniciar} aria-busy={pendenteIniciar}>
                          <input type="hidden" name="id" value={agendamento.id} />
                          <Button type="submit" variant="outline" className="h-9" disabled={pendenteIniciar}>
                            {rotuloDoBotao(ROTULO_INICIAR, PENDENTE_INICIAR, pendenteIniciar)}
                          </Button>
                        </form>
                      ) : null}
                      {podeCancelar(agendamento) ? (
                        <FormularioCancelar
                          id={agendamento.id}
                          acao={acaoCancelar}
                          pendente={pendenteCancelar}
                          estado={cancelamento}
                        />
                      ) : null}
                      {podeEvoluir(agendamento, papel, usuarioId, opcoes.dentistas) ? (
                        <FormularioEvolucao
                          agendamento={agendamento}
                          acao={acaoEvolucao}
                          pendente={pendenteEvolucao}
                        />
                      ) : null}
                      {agendamento.status === "concluido" && podeBloquear ? (
                        <FormularioMarcarRetorno
                          id={agendamento.id}
                          acao={acaoRetorno}
                          pendente={pendenteRetorno}
                        />
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const rotuloCampo = "flex-col items-stretch gap-1.5";

function CampoRotulo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <Label className={rotuloCampo}>
      {rotulo}
      {children}
    </Label>
  );
}

function ResumoAgendamento({
  agendamento,
  opcoes,
}: {
  agendamento: Agendamento;
  opcoes: OpcoesAgendamento;
}) {
  const paciente = opcoes.pacientes.find((item) => item.id === agendamento.pacienteId)?.nome;
  const dentista = opcoes.dentistas.find((item) => item.id === agendamento.dentistaId)?.nome;
  const cadeira = opcoes.cadeiras.find((item) => item.id === agendamento.cadeiraId)?.identificacao;
  const procedimento = agendamento.procedimentoId
    ? opcoes.procedimentos.find((item) => item.id === agendamento.procedimentoId)?.nome
    : null;
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2">
      <p className="m-0 text-base leading-6 font-semibold text-tinta">{paciente ?? "—"}</p>
      <Badge variant={varianteStatus(agendamento.status)}>{rotuloStatus(agendamento.status)}</Badge>
      <dl className="col-span-full m-0 flex flex-wrap gap-x-8 gap-y-2">
        <div>
          <dt className="text-xs leading-4 font-semibold text-apagado">Dentista</dt>
          <dd className="m-0 text-sm leading-5 text-tinta">{dentista ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs leading-4 font-semibold text-apagado">Cadeira</dt>
          <dd className="m-0 text-sm leading-5 text-tinta">{cadeira ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs leading-4 font-semibold text-apagado">Intervalo</dt>
          <dd className="m-0 text-sm leading-5 text-tinta">{intervaloLegivel(agendamento.inicio, agendamento.fim)}</dd>
        </div>
        {procedimento ? (
          <div>
            <dt className="text-xs leading-4 font-semibold text-apagado">Procedimento</dt>
            <dd className="m-0 text-sm leading-5 text-tinta">{procedimento}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function CamposCriar({
  opcoes,
  inicial,
  slot,
}: {
  opcoes: OpcoesAgendamento;
  inicial: ValoresIniciais;
  slot: SlotNovo | null;
}) {
  const [inicio, setInicio] = useState(slot?.inicio ?? "");
  const [fim, setFim] = useState(slot?.fim ?? "");
  const [procedimentoId, setProcedimentoId] = useState(inicial.procedimentoId);

  function aoEscolherProcedimento(valor: string) {
    setProcedimentoId(valor);
    const inicioLimpo = inicio.trim();
    if (!valor || !inicioLimpo) return;
    const procedimento = opcoes.procedimentos.find((item) => item.id === valor);
    if (!procedimento) return;
    setFim(sugerirFim(inicioLimpo, procedimento.tempoMedioMinutos));
  }

  return (
    <>
      <CampoRotulo rotulo="Paciente">
        <NativeSelect name="pacienteId" defaultValue={inicial.pacienteId} required>
          <NativeSelectOption value="">Selecione</NativeSelectOption>
          {opcoes.pacientes.map((paciente) => (
            <NativeSelectOption key={paciente.id} value={paciente.id}>
              {paciente.nome}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </CampoRotulo>
      <CampoRotulo rotulo="Dentista">
        <NativeSelect name="dentistaId" defaultValue={slot?.dentistaId || inicial.dentistaId} required>
          <NativeSelectOption value="">Selecione</NativeSelectOption>
          {opcoes.dentistas.map((dentista) => (
            <NativeSelectOption key={dentista.id} value={dentista.id}>
              {dentista.nome}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </CampoRotulo>
      <CampoRotulo rotulo="Cadeira">
        <NativeSelect name="cadeiraId" defaultValue={slot?.cadeiraId ?? ""} required>
          <NativeSelectOption value="">Selecione</NativeSelectOption>
          {opcoes.cadeiras.map((cadeira) => (
            <NativeSelectOption key={cadeira.id} value={cadeira.id}>
              {cadeira.identificacao}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </CampoRotulo>
      <CampoRotulo rotulo="Início">
        <Input
          name="inicio"
          type="datetime-local"
          value={inicio}
          onChange={(evento) => setInicio(evento.target.value)}
          required
        />
      </CampoRotulo>
      <CampoRotulo rotulo="Fim">
        <Input
          name="fim"
          type="datetime-local"
          value={fim}
          onChange={(evento) => setFim(evento.target.value)}
          required
        />
      </CampoRotulo>
      <CampoRotulo rotulo="Procedimento">
        <NativeSelect
          name="procedimentoId"
          value={procedimentoId}
          onChange={(evento) => aoEscolherProcedimento(evento.target.value)}
        >
          <NativeSelectOption value="">Sem procedimento</NativeSelectOption>
          {opcoes.procedimentos.map((procedimento) => (
            <NativeSelectOption key={procedimento.id} value={procedimento.id}>
              {procedimento.nome}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </CampoRotulo>
    </>
  );
}

function DentistaDoBloqueio({
  papel,
  usuarioId,
  dentistas,
}: {
  papel: Papel;
  usuarioId: string;
  dentistas: OpcoesAgendamento["dentistas"];
}) {
  if (papel === "admin") {
    return (
      <CampoRotulo rotulo="Dentista">
        <NativeSelect name="dentistaId" defaultValue="" required>
          <NativeSelectOption value="">Selecione</NativeSelectOption>
          {dentistas.map((dentista) => (
            <NativeSelectOption key={dentista.id} value={dentista.id}>
              {dentista.nome}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </CampoRotulo>
    );
  }

  const proprio = dentistas.find((dentista) => dentista.usuarioId === usuarioId);
  return <input type="hidden" name="dentistaId" value={proprio?.id ?? ""} />;
}

function podeIniciar(
  agendamento: Agendamento,
  papel: Papel,
  usuarioId: string,
  dentistas: OpcoesAgendamento["dentistas"],
): boolean {
  const aberto = agendamento.status === "agendado" || agendamento.status === "em_espera";
  if (!aberto) return false;
  if (papel === "admin") return true;
  return dentistas.some(
    (dentista) => dentista.id === agendamento.dentistaId && dentista.usuarioId === usuarioId,
  );
}

// Uma mensagem por vez: a mais recente. `detalhe` guarda id para a tela, não texto para a pessoa.
function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  return { status: escolhido.status, mensagem: escolhido.mensagem, quando: escolhido.quando };
}
