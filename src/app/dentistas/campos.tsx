import type { Ref } from "react";
import type { Dentista } from "../../domain/dentista/tipos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const campo = "dentistas-campo w-full min-w-0 flex-col items-stretch gap-2 font-semibold";

export function Campos({
  dentista,
  nomeRef,
}: {
  dentista?: Dentista;
  nomeRef?: Ref<HTMLInputElement>;
}) {
  return (
    <>
      <Label className={campo}>
        Nome
        <Input ref={nomeRef} name="nome" defaultValue={dentista?.nome} required />
      </Label>
      <Label className={campo}>
        CRO
        <Input name="cro" defaultValue={dentista?.cro} required />
      </Label>
      <Label className={campo}>
        Telefone
        <Input name="telefone" type="tel" defaultValue={dentista?.telefone} required />
      </Label>
      <Label className={campo}>
        CPF
        <Input name="cpf" defaultValue={dentista?.cpf} required />
      </Label>
      <Label className={`${campo} dentistas-campo-largo sm:col-span-2`}>
        Especialidades (separadas por vírgula)
        <Input name="especialidades" defaultValue={dentista?.especialidades.join(", ")} />
      </Label>
    </>
  );
}
