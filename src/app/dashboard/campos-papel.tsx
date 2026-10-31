"use client";

import { useState, type FormEvent } from "react";
import { CAMPOS_DASHBOARD, type CampoDashboard } from "../../domain/dashboard/tipos";
import { salvarCamposDoPapel, type Papel, type RespostaDashboard } from "./actions";

export const ROTULOS_CAMPO: Record<CampoDashboard, string> = {
  faturamento: "Faturamento no período",
  recebido: "Valores recebidos",
  despesa: "Despesa de prótese",
  ocupacao: "Ocupação da agenda",
  estoque: "Materiais abaixo do mínimo",
  detalhe: "Faturamento por dentista e por procedimento",
};

const PAPEIS: Papel[] = ["admin", "dentista", "recepcionista"];

export function CamposDoPapel({
  pendente,
  executar,
}: {
  pendente: boolean;
  executar: (acao: () => Promise<RespostaDashboard>, sucesso: string) => void;
}) {
  const [papel, setPapel] = useState<Papel>("recepcionista");

  function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const ocultos = CAMPOS_DASHBOARD.filter((campo) => dados.get(campo) === "on");
    executar(() => salvarCamposDoPapel(papel, ocultos), "Campos do papel salvos");
  }

  return (
    <section className="dashboard-papel" aria-labelledby="dashboard-titulo-papel">
      <h2 id="dashboard-titulo-papel">Blocos por papel</h2>
      <form className="dashboard-form" onSubmit={salvar} aria-busy={pendente}>
        <label className="dashboard-campo">
          Papel
          <select value={papel} onChange={(evento) => setPapel(evento.target.value as Papel)}>
            {PAPEIS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="dashboard-campos-papel" key={papel}>
          <legend>Campos ocultos para o papel</legend>
          {CAMPOS_DASHBOARD.map((campo) => (
            <label key={campo} className="dashboard-marca">
              <input type="checkbox" name={campo} />
              {ROTULOS_CAMPO[campo]}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="dashboard-botao" disabled={pendente}>
          Salvar campos do papel
        </button>
      </form>
    </section>
  );
}
