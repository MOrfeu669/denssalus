import type { Ref } from "react";
import type { Procedimento } from "../../domain/procedimento/tipos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const campo = "procedimentos-campo w-full min-w-0 flex-col items-stretch gap-2 font-semibold";

export function Campos({
  procedimento,
  nomeRef,
}: {
  procedimento?: Procedimento;
  nomeRef?: Ref<HTMLInputElement>;
}) {
  return (
    <div className="procedimentos-campos grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <Label className={`${campo} procedimentos-campo-nome`}>
        Nome
        <Input ref={nomeRef} name="nome" defaultValue={procedimento?.nome} required />
      </Label>
      <Label className={campo}>
        Tempo médio (min)
        <Input
          name="tempoMedioMinutos"
          type="number"
          min={1}
          step={1}
          defaultValue={procedimento?.tempoMedioMinutos}
          required
        />
      </Label>
      <Label className={campo}>
        Valor médio
        <Input
          name="valorMedio"
          type="number"
          min={0}
          step={0.01}
          defaultValue={procedimento?.valorMedio}
          required
        />
      </Label>
    </div>
  );
}

export function valorDe(procedimento: Procedimento): string {
  const valor = procedimento.valorMedio.toFixed(2).replace(".", ",");
  return `R$ ${valor}`;
}
