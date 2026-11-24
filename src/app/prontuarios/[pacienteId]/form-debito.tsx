"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FORMAS_PAGAMENTO, type FormaPagamento } from "../../../domain/debito/tipos";
import { Aviso } from "../../aviso";
import { estadoVazio, type EstadoFormulario } from "../../formulario";
import { aplicarDesconto, quitarDebito } from "./acoes-debito";

type Acao = (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;

export const NOME_FORMA: Record<FormaPagamento, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_debito: "Cartão de débito",
  cartao_credito: "Cartão de crédito",
  boleto: "Boleto",
  cheque: "Cheque",
};

function useFormulario(acao: Acao) {
  const roteador = useRouter();
  const [resposta, executar, pendente] = useActionState(acao, estadoVazio);
  useEffect(() => {
    if (resposta.status === "sucesso") roteador.refresh();
  }, [resposta, roteador]);
  return { resposta, executar, pendente };
}

export function FormularioDesconto({
  pacienteId,
  debitoId,
}: {
  pacienteId: string;
  debitoId: string;
}) {
  const { resposta, executar, pendente } = useFormulario(aplicarDesconto);
  return (
    <>
      <Aviso tipo={resposta.status} mensagem={resposta.mensagem} />
      <form action={executar} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <input type="hidden" name="debitoId" value={debitoId} />
        <Label className="flex-col items-stretch gap-1.5">
          Desconto
          <Input type="number" name="desconto" min="0" step="0.01" required />
        </Label>
        <Button type="submit" disabled={pendente}>
          Aplicar desconto
        </Button>
      </form>
    </>
  );
}

export function FormularioQuitar({
  pacienteId,
  debitoId,
}: {
  pacienteId: string;
  debitoId: string;
}) {
  const { resposta, executar, pendente } = useFormulario(quitarDebito);
  return (
    <>
      <Aviso tipo={resposta.status} mensagem={resposta.mensagem} />
      <form action={executar} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <input type="hidden" name="debitoId" value={debitoId} />
        <Label className="flex-col items-stretch gap-1.5">
          Forma de pagamento
          <NativeSelect name="forma" defaultValue="" required>
            <NativeSelectOption value="">Selecione</NativeSelectOption>
            {FORMAS_PAGAMENTO.map((forma) => (
              <NativeSelectOption key={forma} value={forma}>
                {NOME_FORMA[forma]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
        <Label className="flex-col items-stretch gap-1.5">
          Data
          <Input type="date" name="data" required />
        </Label>
        <Button type="submit" disabled={pendente}>
          Quitar
        </Button>
      </form>
    </>
  );
}
