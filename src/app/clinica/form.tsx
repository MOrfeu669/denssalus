"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { DetalheClinica } from "../../domain/clinica/tipos";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { adicionar, criar, desativar, salvarHorario } from "./actions";
import { Alerta, BotaoAcao } from "./alerta";
import { Funcionamento, type CamposFuncionamento } from "./funcionamento";
import { CLINICA_CADEIRAS_VAZIO, CLINICA_SEM_CLINICA, mensagemComDetalhe } from "./texto";

const DIAS_PADRAO = ["segunda", "terca", "quarta", "quinta", "sexta"];

export function Clinica({ detalhe }: { detalhe: DetalheClinica | null }) {
  const roteador = useRouter();
  const [criacao, acaoCriar, pendenteCriar] = useActionState(criar, estadoVazio);
  const [horario, acaoHorario, pendenteHorario] = useActionState(salvarHorario, estadoVazio);
  const [inclusao, acaoAdicionar, pendenteAdicionar] = useActionState(adicionar, estadoVazio);
  const [desativacao, acaoDesativar] = useActionState(desativar, estadoVazio);
  const aviso = avisoVisivel(criacao, horario, inclusao, desativacao);

  useEffect(() => {
    const estados = [criacao, horario, inclusao, desativacao];
    if (estados.some((item) => item.status === "sucesso")) roteador.refresh();
  }, [criacao, horario, inclusao, desativacao, roteador]);

  if (!detalhe) {
    return (
      <>
        <Alerta status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
        <section className="clinica-cartao" aria-labelledby="clinica-nova">
          <h2 id="clinica-nova" className="clinica-subtitulo">
            Criar clínica
          </h2>
          <p className="clinica-intro">{CLINICA_SEM_CLINICA}</p>
          <form action={acaoCriar} aria-busy={pendenteCriar} className="clinica-form">
            <label className="clinica-campo">
              Nome da clínica
              <input name="nome" required />
            </label>
            <Funcionamento
              campos={{ dias: DIAS_PADRAO, abertura: "08:00", fechamento: "18:00" }}
              sugestao
            />
            <label className="clinica-campo">
              Cadeiras
              <input name="cadeiras" type="number" min={1} step={1} defaultValue={1} required />
            </label>
            <div className="clinica-acoes">
              <BotaoAcao rotulo="Criar clínica" pendente="Salvando…" className="clinica-botao" />
            </div>
          </form>
        </section>
      </>
    );
  }

  const { clinica, cadeiras } = detalhe;
  const campos: CamposFuncionamento = {
    dias: clinica.diasAtendimento,
    abertura: clinica.horarioAbertura,
    fechamento: clinica.horarioFechamento,
  };

  return (
    <>
      <Alerta status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
      <section className="clinica-cartao" aria-labelledby="clinica-funcionamento">
        <h2 id="clinica-funcionamento" className="clinica-subtitulo">
          {clinica.nome}
        </h2>
        <form
          key={`${campos.dias.join(",")}-${campos.abertura}-${campos.fechamento}`}
          action={acaoHorario}
          aria-busy={pendenteHorario}
          className="clinica-form"
        >
          <Funcionamento campos={campos} />
          <div className="clinica-acoes">
            <BotaoAcao rotulo="Salvar horário e dias" pendente="Salvando…" className="clinica-botao" />
          </div>
        </form>
      </section>
      <section className="clinica-cartao" aria-labelledby="clinica-cadeiras">
        <h2 id="clinica-cadeiras" className="clinica-subtitulo">
          Cadeiras
        </h2>
        {cadeiras.length === 0 ? (
          <p className="clinica-vazio">{CLINICA_CADEIRAS_VAZIO}</p>
        ) : (
          <ul className="clinica-lista">
            {cadeiras.map((cadeira) => (
              <li key={cadeira.id} className="clinica-linha">
                <span className="clinica-cadeira">
                  <span className="clinica-nome">{cadeira.identificacao}</span>
                  {cadeira.ativa ? null : (
                    <span className="clinica-inativa">! Desativada</span>
                  )}
                </span>
                {cadeira.ativa ? (
                  <form action={acaoDesativar} className="clinica-desativar">
                    <input type="hidden" name="id" value={cadeira.id} />
                    <BotaoAcao
                      rotulo="Desativar"
                      pendente="Desativando…"
                      className="clinica-botao-sec"
                      nomeAcessivel={`Desativar cadeira ${cadeira.identificacao}`}
                    />
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <form action={acaoAdicionar} aria-busy={pendenteAdicionar} className="clinica-form">
          <div className="clinica-acoes">
            <BotaoAcao
              rotulo="Adicionar cadeira"
              pendente="Adicionando…"
              className="clinica-botao-sec"
            />
          </div>
        </form>
      </section>
    </>
  );
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  return {
    status: escolhido.status,
    mensagem: mensagemComDetalhe(escolhido.mensagem, escolhido.detalhe),
    quando: escolhido.quando,
  };
}
