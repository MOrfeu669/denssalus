"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { DetalheClinica } from "../../domain/clinica/tipos";
import { Aviso } from "../aviso";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { adicionar, criar, desativar, salvarHorario } from "./actions";
import { DIAS } from "./validar";

const DIAS_PADRAO = ["segunda", "terca", "quarta", "quinta", "sexta"];

type Campos = { dias: readonly string[]; abertura: string; fechamento: string };

export function Clinica({ detalhe }: { detalhe: DetalheClinica | null }) {
  const roteador = useRouter();
  const [criacao, acaoCriar, pendenteCriar] = useActionState(criar, estadoVazio);
  const [horario, acaoHorario, pendenteHorario] = useActionState(salvarHorario, estadoVazio);
  const [inclusao, acaoAdicionar, pendenteAdicionar] = useActionState(adicionar, estadoVazio);
  const [desativacao, acaoDesativar, pendenteDesativar] = useActionState(desativar, estadoVazio);
  const aviso = avisoVisivel(criacao, horario, inclusao, desativacao);

  useEffect(() => {
    const estados = [criacao, horario, inclusao, desativacao];
    if (estados.some((item) => item.status === "sucesso")) roteador.refresh();
  }, [criacao, horario, inclusao, desativacao, roteador]);

  if (!detalhe) {
    return (
      <>
        <Aviso tipo={aviso.status} mensagem={aviso.mensagem} />
        <p>Esta conta ainda não tem clínica. Crie a clínica para configurar horário e cadeiras.</p>
        <form action={acaoCriar} aria-busy={pendenteCriar}>
          <label>
            Nome da clínica
            <input name="nome" required />
          </label>
          <Funcionamento campos={{ dias: DIAS_PADRAO, abertura: "08:00", fechamento: "18:00" }} />
          <label>
            Cadeiras
            <input name="cadeiras" type="number" min={1} step={1} defaultValue={1} required />
          </label>
          <button type="submit" disabled={pendenteCriar}>
            {pendenteCriar ? "Salvando…" : "Criar clínica"}
          </button>
        </form>
      </>
    );
  }

  const { clinica, cadeiras } = detalhe;
  const campos: Campos = {
    dias: clinica.diasAtendimento,
    abertura: clinica.horarioAbertura,
    fechamento: clinica.horarioFechamento,
  };

  return (
    <>
      <Aviso tipo={aviso.status} mensagem={aviso.mensagem} />
      <h2>{clinica.nome}</h2>
      <form
        key={`${campos.dias.join(",")}-${campos.abertura}-${campos.fechamento}`}
        action={acaoHorario}
        aria-busy={pendenteHorario}
      >
        <Funcionamento campos={campos} />
        <button type="submit" disabled={pendenteHorario}>
          {pendenteHorario ? "Salvando…" : "Salvar horário"}
        </button>
      </form>
      <h2>Cadeiras</h2>
      {cadeiras.length === 0 ? (
        <p>Nenhuma cadeira cadastrada nesta clínica.</p>
      ) : (
        <ul className="lista">
          {cadeiras.map((cadeira) => (
            <li key={cadeira.id}>
              <span>
                {cadeira.identificacao}
                {cadeira.ativa ? "" : " · ! desativada"}
              </span>
              {cadeira.ativa ? (
                <form action={acaoDesativar}>
                  <input type="hidden" name="id" value={cadeira.id} />
                  <button
                    type="submit"
                    disabled={pendenteDesativar}
                    aria-label={`Desativar cadeira ${cadeira.identificacao}`}
                  >
                    Desativar cadeira
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form action={acaoAdicionar} aria-busy={pendenteAdicionar}>
        <button type="submit" disabled={pendenteAdicionar}>
          {pendenteAdicionar ? "Salvando…" : "Adicionar cadeira"}
        </button>
      </form>
    </>
  );
}

function Funcionamento({ campos }: { campos: Campos }) {
  return (
    <>
      <fieldset>
        <legend>Dias de atendimento</legend>
        {DIAS.map((dia) => (
          <label key={dia.valor}>
            <input
              type="checkbox"
              name="dias"
              value={dia.valor}
              defaultChecked={campos.dias.includes(dia.valor)}
            />
            {dia.rotulo}
          </label>
        ))}
      </fieldset>
      <label>
        Abertura
        <input name="abertura" type="time" defaultValue={campos.abertura} required />
      </label>
      <label>
        Fechamento
        <input name="fechamento" type="time" defaultValue={campos.fechamento} required />
      </label>
    </>
  );
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  const mensagem = escolhido.detalhe ? `${escolhido.mensagem}: ${escolhido.detalhe}` : escolhido.mensagem;
  return { status: escolhido.status, mensagem };
}
