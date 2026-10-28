"use client";

import type { DebitoComPagamento } from "../../../domain/debito/tipos";
import { FormularioDesconto, FormularioQuitar, NOME_FORMA } from "./form-debito";

type Papel = "admin" | "dentista" | "recepcionista";

const STATUS_DEBITO: Record<DebitoComPagamento["status"], string> = {
  em_aberto: "em aberto",
  quitado: "quitado",
};

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataBr(data: string): string {
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function Debito({
  debito,
  pacienteId,
  papel,
}: {
  debito: DebitoComPagamento;
  pacienteId: string;
  papel: Papel;
}) {
  const partes = [
    `Valor ${moeda(debito.valor)}`,
    `Desconto ${moeda(debito.desconto)}`,
    STATUS_DEBITO[debito.status],
  ];
  if (debito.pagamento) {
    partes.push(NOME_FORMA[debito.pagamento.forma], dataBr(debito.pagamento.data));
  }
  const emAberto = debito.status === "em_aberto";
  return (
    <li>
      <span>{partes.join(" · ")}</span>
      {emAberto && papel !== "recepcionista" ? (
        <FormularioDesconto pacienteId={pacienteId} debitoId={debito.id} />
      ) : null}
      {emAberto && papel === "admin" ? (
        <FormularioQuitar pacienteId={pacienteId} debitoId={debito.id} />
      ) : null}
    </li>
  );
}

export function SecaoDebitos({
  pacienteId,
  debitos,
  papel,
}: {
  pacienteId: string;
  debitos: DebitoComPagamento[];
  papel: Papel;
}) {
  return (
    <>
      {debitos.length === 0 ? <p>Nenhum débito.</p> : null}
      <ul className="lista">
        {debitos.map((debito) => (
          <Debito key={debito.id} debito={debito} pacienteId={pacienteId} papel={papel} />
        ))}
      </ul>
    </>
  );
}
