"use client";

import type { Protese } from "../../../domain/protese/tipos";
import {
  FormularioConferencia,
  FormularioDescontinuar,
  FormularioEnvio,
  FormularioInstalacao,
  FormularioLimite,
  FormularioPedido,
} from "./form-protese";
import { dataAgendamento } from "./formato";
import type { AgendamentoOpcao, ProcedimentoOpcao } from "./tipos-odontograma";
import { ETAPA_PROTESE, STATUS_PROTESE, type ResponsavelOpcao } from "./tipos-protese";

function Acoes({
  protese,
  pacienteId,
  agendamentos,
}: {
  protese: Protese;
  pacienteId: string;
  agendamentos: AgendamentoOpcao[];
}) {
  if (protese.status !== "em_andamento") return null;
  const ids = { pacienteId, proteseId: protese.id };
  return (
    <>
      {protese.etapa === "pre_envio" ? <FormularioEnvio {...ids} /> : null}
      {protese.etapa === "envio_acompanhamento" ? <FormularioConferencia {...ids} /> : null}
      {protese.etapa === "recebimento_conferencia" ? (
        <FormularioInstalacao {...ids} agendamentos={agendamentos} />
      ) : null}
      <FormularioDescontinuar {...ids} />
    </>
  );
}

function Item({
  protese,
  pacienteId,
  agendamentos,
}: {
  protese: Protese;
  pacienteId: string;
  agendamentos: AgendamentoOpcao[];
}) {
  const partes = [
    protese.tipo,
    `Dentes ${protese.dentes.join(", ")}`,
    protese.laboratorio,
    ETAPA_PROTESE[protese.etapa],
    STATUS_PROTESE[protese.status],
  ];
  if (protese.prazoRetorno) partes.push(`Retorno até ${dataAgendamento(protese.prazoRetorno)}`);
  return (
    <li>
      <span>{partes.join(" · ")}</span>
      {protese.alertaAtraso ? <strong> Atraso</strong> : null}
      <Acoes protese={protese} pacienteId={pacienteId} agendamentos={agendamentos} />
    </li>
  );
}

export function ProtesesDoDente({ proteses, dente }: { proteses: Protese[]; dente: number }) {
  const doDente = proteses.filter((protese) => protese.dentes.includes(dente));
  return (
    <section aria-label={`Próteses do dente ${dente}`}>
      <h4>Próteses do dente {dente}</h4>
      {doDente.length === 0 ? <p>Nenhuma prótese neste dente.</p> : null}
      <ul className="lista">
        {doDente.map((protese) => (
          <li key={protese.id}>
            {[
              protese.tipo,
              protese.laboratorio,
              ETAPA_PROTESE[protese.etapa],
              STATUS_PROTESE[protese.status],
            ].join(" · ")}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SecaoProteses({
  pacienteId,
  proteses,
  responsaveis,
  procedimentos,
  agendamentos,
  papel,
  limite,
}: {
  pacienteId: string;
  proteses: Protese[];
  responsaveis: ResponsavelOpcao[];
  procedimentos: ProcedimentoOpcao[];
  agendamentos: AgendamentoOpcao[];
  papel: string;
  limite: number;
}) {
  return (
    <>
      <FormularioPedido
        pacienteId={pacienteId}
        responsaveis={responsaveis}
        procedimentos={procedimentos}
      />
      {papel === "admin" ? <FormularioLimite limite={limite} /> : null}
      {proteses.length === 0 ? <p>Nenhuma prótese registrada.</p> : null}
      <ul className="lista">
        {proteses.map((protese) => (
          <Item
            key={protese.id}
            protese={protese}
            pacienteId={pacienteId}
            agendamentos={agendamentos}
          />
        ))}
      </ul>
    </>
  );
}
