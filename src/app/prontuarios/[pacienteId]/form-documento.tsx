"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { ModeloDocumento } from "../../../domain/documento/tipos";
import { Aviso } from "../../aviso";
import { estadoVazio, type EstadoFormulario } from "../../formulario";
import { criarModelo, gerarDocumento, importarModelo } from "./acoes-documento";

type Acao = (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;

function useFormulario(acao: Acao) {
  const roteador = useRouter();
  const [resposta, executar, pendente] = useActionState(acao, estadoVazio);
  useEffect(() => {
    if (resposta.status === "sucesso") roteador.refresh();
  }, [resposta, roteador]);
  return { resposta, executar, pendente };
}

export function FormularioGerar({
  pacienteId,
  modelos,
  modeloId,
  anteriorId,
  descricao,
}: {
  pacienteId: string;
  modelos?: ModeloDocumento[];
  modeloId?: string;
  anteriorId?: string;
  descricao?: string;
}) {
  const { resposta, executar, pendente } = useFormulario(gerarDocumento);
  return (
    <>
      <Aviso tipo={resposta.status} mensagem={resposta.mensagem} />
      <form action={executar} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        {anteriorId ? <input type="hidden" name="anteriorId" value={anteriorId} /> : null}
        {modeloId ? <input type="hidden" name="modeloId" value={modeloId} /> : null}
        {modelos ? (
          <Label className="flex-col items-stretch gap-1.5">
            Modelo
            <NativeSelect name="modeloId" defaultValue="" required>
              <NativeSelectOption value="">Selecione</NativeSelectOption>
              {modelos.map((modelo) => (
                <NativeSelectOption key={modelo.id} value={modelo.id}>
                  {modelo.nome}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Label>
        ) : null}
        <Button type="submit" disabled={pendente} aria-describedby={descricao}>
          Gerar documento
        </Button>
      </form>
    </>
  );
}

export function FormularioPersonalizar({ pacienteId }: { pacienteId: string }) {
  const { resposta, executar, pendente } = useFormulario(criarModelo);
  return (
    <>
      <Aviso tipo={resposta.status} mensagem={resposta.mensagem} />
      <form action={executar} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <Label className="flex-col items-stretch gap-1.5">
          Nome do modelo
          <Input type="text" name="nome" required />
        </Label>
        <Label className="flex-col items-stretch gap-1.5">
          Conteúdo do modelo
          <Textarea name="conteudo" rows={6} required />
        </Label>
        <Label>
          <input type="checkbox" name="compartilhado" className="size-4 accent-primary" />
          Compartilhado
        </Label>
        <Button type="submit" disabled={pendente}>
          Personalizar
        </Button>
      </form>
    </>
  );
}

export function FormularioImportar({
  pacienteId,
  modelo,
}: {
  pacienteId: string;
  modelo: ModeloDocumento;
}) {
  const { resposta, executar, pendente } = useFormulario(importarModelo);
  return (
    <li>
      <span id={`modelo-${modelo.id}`}>{modelo.nome}</span>
      <Aviso tipo={resposta.status} mensagem={resposta.mensagem} />
      <form action={executar} aria-busy={pendente}>
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <input type="hidden" name="modeloId" value={modelo.id} />
        <Button type="submit" variant="outline" disabled={pendente} aria-describedby={`modelo-${modelo.id}`}>
          Importar modelo
        </Button>
      </form>
    </li>
  );
}
