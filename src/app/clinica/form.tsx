"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import type { DetalheClinica } from "../../domain/clinica/tipos";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { adicionar, alternar, criar, salvarHorario } from "./actions";
import { Alerta, BotaoAcao } from "./alerta";
import { Funcionamento, type CamposFuncionamento } from "./funcionamento";
import { CLINICA_CADEIRAS_VAZIO, CLINICA_SEM_CLINICA, mensagemComDetalhe } from "./texto";

const DIAS_PADRAO = ["segunda", "terca", "quarta", "quinta", "sexta"];
const campo = "w-full flex-col items-stretch gap-2 font-semibold";

export function Clinica({ detalhe }: { detalhe: DetalheClinica | null }) {
  const roteador = useRouter();
  const [criacao, acaoCriar, pendenteCriar] = useActionState(criar, estadoVazio);
  const [horario, acaoHorario, pendenteHorario] = useActionState(salvarHorario, estadoVazio);
  const [inclusao, acaoAdicionar, pendenteAdicionar] = useActionState(adicionar, estadoVazio);
  const [ativacao, acaoAlternar] = useActionState(alternar, estadoVazio);
  const aviso = avisoVisivel(criacao, horario, inclusao, ativacao);

  useEffect(() => {
    const estados = [criacao, horario, inclusao, ativacao];
    if (estados.some((item) => item.status === "sucesso")) roteador.refresh();
  }, [criacao, horario, inclusao, ativacao, roteador]);

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
            <Label className={`clinica-campo ${campo}`}>
              Nome da clínica
              <Input name="nome" required />
            </Label>
            <Funcionamento
              campos={{ dias: DIAS_PADRAO, abertura: "08:00", fechamento: "18:00" }}
              sugestao
            />
            <Label className={`clinica-campo ${campo}`}>
              Cadeiras
              <Input name="cadeiras" type="number" min={1} step={1} defaultValue={1} required />
            </Label>
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
      <div className="clinica-grade">
        <div className="clinica-coluna">
          <section className="clinica-cartao" aria-labelledby="clinica-dados">
            <h2 id="clinica-dados" className="clinica-subtitulo">
              Dados da clínica
            </h2>
            <p className="clinica-ajuda">Identificação exibida no sistema.</p>
            <Label className={`clinica-campo ${campo}`}>
              Nome da clínica
              <Input value={clinica.nome} readOnly aria-readonly="true" />
            </Label>
          </section>
          <section className="clinica-cartao" aria-labelledby="clinica-funcionamento">
            <h2 id="clinica-funcionamento" className="clinica-subtitulo">
              Horário de atendimento
            </h2>
            <p className="clinica-ajuda">
              Um único horário de abertura e fechamento para todos os dias.
            </p>
            <form
              key={`${campos.dias.join(",")}-${campos.abertura}-${campos.fechamento}`}
              action={acaoHorario}
              aria-busy={pendenteHorario}
              className="clinica-form"
            >
              <Funcionamento campos={campos} />
              <div className="clinica-acoes clinica-acoes-rodape">
                <BotaoAcao
                  rotulo="Salvar alterações"
                  pendente="Salvando…"
                  className="clinica-botao"
                />
              </div>
            </form>
          </section>
        </div>
        <section className="clinica-cartao clinica-cartao-cadeiras" aria-labelledby="clinica-cadeiras">
          <div className="clinica-cadeiras-topo">
            <div>
              <h2 id="clinica-cadeiras" className="clinica-subtitulo">
                Cadeiras
              </h2>
              <p className="clinica-ajuda">Cada cadeira pode ser agendada separadamente.</p>
            </div>
            <form action={acaoAdicionar} aria-busy={pendenteAdicionar} className="clinica-form-inline">
              <BotaoAcao
                rotulo="Adicionar cadeira"
                pendente="Adicionando…"
                className="clinica-botao-sec"
                variante="outline"
              />
            </form>
          </div>
          {cadeiras.length === 0 ? (
            <p className="clinica-vazio">{CLINICA_CADEIRAS_VAZIO}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cadeira</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cadeiras.map((cadeira) => (
                  <TableRow key={cadeira.id} className={cadeira.ativa ? undefined : "opacity-70"}>
                    <TableCell className="font-semibold whitespace-normal">{cadeira.identificacao}</TableCell>
                    <TableCell className="whitespace-normal">
                      <Badge variant={cadeira.ativa ? "success" : "warning"} className="h-auto whitespace-normal">
                        {cadeira.ativa
                          ? "Disponível para agendamento"
                          : "Indisponível para novos agendamentos"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={acaoAlternar} className="clinica-desativar">
                        <input type="hidden" name="id" value={cadeira.id} />
                        <input type="hidden" name="ligar" value={cadeira.ativa ? "false" : "true"} />
                        <Interruptor ligado={cadeira.ativa} nome={cadeira.identificacao} />
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </>
  );
}

function Interruptor({ ligado, nome }: { ligado: boolean; nome: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="clinica-interruptor"
      role="switch"
      aria-checked={ligado}
      aria-label={nome}
      disabled={pending}
    >
      <span className="clinica-interruptor-trilho" aria-hidden="true">
        <span className="clinica-interruptor-bolinha" />
      </span>
      {ligado ? "Ativa" : "Desativada"}
    </button>
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
