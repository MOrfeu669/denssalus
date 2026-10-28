"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { RetornoVisivel } from "../../domain/retorno/tipos";
import { Aviso } from "../aviso";
import { estadoVazio } from "../formulario";
import { salvarPrazo } from "./actions";

export function Retornos({ retornos }: { retornos: RetornoVisivel[] }) {
  if (retornos.length === 0) return <p>Nenhum retorno pendente.</p>;
  return (
    <ul className="lista">
      {retornos.map((retorno) => (
        <li key={retorno.id}>
          <span>{retorno.texto}</span>
          <span> · retorno previsto para {retorno.dataPrevista}</span>
        </li>
      ))}
    </ul>
  );
}

export function FormularioPrazo({ prazo }: { prazo: number }) {
  const roteador = useRouter();
  const [resultado, acao, pendente] = useActionState(salvarPrazo, estadoVazio);

  useEffect(() => {
    if (resultado.status === "sucesso") roteador.refresh();
  }, [resultado, roteador]);

  return (
    <>
      <Aviso tipo={resultado.status} mensagem={resultado.mensagem} />
      <form action={acao} aria-busy={pendente}>
        <label>
          Prazo
          <input
            name="diasAntecedencia"
            type="number"
            min={1}
            step={1}
            defaultValue={prazo}
            required
          />
        </label>
        <button type="submit" disabled={pendente}>
          Salvar prazo
        </button>
      </form>
    </>
  );
}

export function FormularioMarcarRetorno({
  id,
  acao,
  pendente,
}: {
  id: string;
  acao: (formData: FormData) => void;
  pendente: boolean;
}) {
  return (
    <form action={acao} aria-busy={pendente}>
      <input type="hidden" name="agendamentoOrigemId" value={id} />
      <label>
        Data prevista
        <input name="dataPrevista" type="date" required />
      </label>
      <button type="submit" disabled={pendente}>
        Marcar retorno
      </button>
    </form>
  );
}
