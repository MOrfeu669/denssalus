"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
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
          <label>
            Modelo
            <select name="modeloId" defaultValue="" required>
              <option value="">Selecione</option>
              {modelos.map((modelo) => (
                <option key={modelo.id} value={modelo.id}>
                  {modelo.nome}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button type="submit" disabled={pendente} aria-describedby={descricao}>
          Gerar documento
        </button>
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
        <label>
          Nome do modelo
          <input type="text" name="nome" required />
        </label>
        <label>
          Conteúdo do modelo
          <textarea name="conteudo" rows={6} required />
        </label>
        <label>
          <input type="checkbox" name="compartilhado" />
          Compartilhado
        </label>
        <button type="submit" disabled={pendente}>
          Personalizar
        </button>
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
        <button type="submit" disabled={pendente} aria-describedby={`modelo-${modelo.id}`}>
          Importar modelo
        </button>
      </form>
    </li>
  );
}
