"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { dataValida, menorDeIdade } from "../../domain/paciente/regras";
import type { Canal, CanalComunicacao, Paciente } from "../../domain/paciente/tipos";
import { estadoVazio } from "../formulario";
import { cadastrar, editar } from "./actions";
import { Alerta } from "./alerta";
import { ROTULO_CANAL, ROTULO_SEXO, TEXTO_VAZIO, textoIdade } from "./texto";

export type PacienteLinha = Paciente & { idade: number | null };

const CANAIS_ORDEM: Canal[] = ["whatsapp", "email", "sms"];
const LINHA_VAZIA: CanalComunicacao = { canal: "whatsapp", contato: "", preferido: true };

export function Pacientes({ pacientes }: { pacientes: PacienteLinha[] }) {
  const roteador = useRouter();
  const [cadastro, acaoCadastrar, pendenteCadastrar] = useActionState(cadastrar, estadoVazio);
  const [edicao, acaoEditar, pendenteEditar] = useActionState(editar, estadoVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const aviso = cadastro.quando >= edicao.quando ? cadastro : edicao;
  const erroNoPainel = aberto && aviso === cadastro && cadastro.status === "erro";

  useEffect(() => {
    if (edicao.status === "sucesso") setEditandoId(null);
    if (cadastro.status === "sucesso") setAberto(false);
  }, [edicao, cadastro]);

  function aoMudar(proximo: boolean, detalhes: { cancel: () => void }) {
    if (!proximo && pendenteCadastrar) {
      detalhes.cancel();
      return;
    }
    setAberto(proximo);
  }

  useEffect(() => {
    if (cadastro.status === "sucesso" || edicao.status === "sucesso") roteador.refresh();
  }, [cadastro, edicao, roteador]);

  return (
    <Dialog open={aberto} onOpenChange={aoMudar} disablePointerDismissal={pendenteCadastrar}>
      <div className="pacientes-topo">
        <div>
          <h1>Pacientes</h1>
          <p className="pacientes-nota">
            Nome completo e ao menos um canal de comunicação são obrigatórios.
          </p>
        </div>
        <DialogTrigger render={<Button type="button" className="pacientes-principal h-10" />}>
          Novo paciente
        </DialogTrigger>
      </div>
      {erroNoPainel ? null : <Alerta estado={aviso} />}
      <div className="pacientes-colunas">
        <section className="pacientes-secao" aria-labelledby="pacientes-lista-titulo">
          <h2 id="pacientes-lista-titulo">Pacientes da clínica</h2>
          {pacientes.length === 0 ? (
            <p className="pacientes-vazio">{TEXTO_VAZIO}</p>
          ) : (
            <ul className="pacientes-lista">
              {pacientes.map((paciente) => (
                <li key={paciente.id} className="pacientes-item">
                  <div className="pacientes-linha">
                    <Resumo paciente={paciente} />
                    <div className="pacientes-acoes">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10"
                        aria-expanded={editandoId === paciente.id}
                        onClick={() => setEditandoId(editandoId === paciente.id ? null : paciente.id)}
                        aria-label={`Editar paciente ${paciente.nome}`}
                      >
                        Editar paciente
                      </Button>
                      <Link
                        className="pacientes-link"
                        href={`/prontuarios/${paciente.id}`}
                        aria-label={`Prontuário de ${paciente.nome}`}
                      >
                        Prontuário
                      </Link>
                    </div>
                  </div>
                  {editandoId === paciente.id ? (
                    <form className="pacientes-form" action={acaoEditar} aria-busy={pendenteEditar}>
                      <input type="hidden" name="id" value={paciente.id} />
                      <Campos paciente={paciente} />
                      <Enviar pendente={pendenteEditar} texto="Salvar paciente" />
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100vh-3rem)] overflow-y-auto sm:max-w-3xl"
      >
        <DialogHeader className="flex-row items-start justify-between pr-0">
          <div className="flex flex-col gap-2">
            <DialogTitle id="pacientes-novo-titulo">Novo paciente</DialogTitle>
            <DialogDescription>
              Nome completo e ao menos um canal de comunicação são obrigatórios.
            </DialogDescription>
          </div>
          <DialogClose className={buttonVariants({ variant: "outline", className: "h-8 shrink-0" })}>
            Fechar
          </DialogClose>
        </DialogHeader>
        {erroNoPainel ? <Alerta estado={cadastro} /> : null}
        <form
          className="pacientes-form"
          key={cadastro.status === "sucesso" ? cadastro.quando : 0}
          action={acaoCadastrar}
          aria-busy={pendenteCadastrar}
        >
          <Campos />
          <Enviar pendente={pendenteCadastrar} texto="Cadastrar paciente" principal />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Enviar({ pendente, texto, principal = false }: { pendente: boolean; texto: string; principal?: boolean }) {
  return (
    <Button type="submit" className={principal ? "pacientes-principal h-10 self-start" : "h-10 self-start"} disabled={pendente}>
      {pendente ? "Salvando…" : texto}
    </Button>
  );
}

function Resumo({ paciente }: { paciente: PacienteLinha }) {
  return (
    <div className="pacientes-resumo">
      <span className="pacientes-nome">{paciente.nome}</span>
      {paciente.idade !== null ? (
        <span className="pacientes-meta">
          {textoIdade(paciente.idade)}
          {paciente.idade < 18 ? " · Menor de idade" : ""}
        </span>
      ) : null}
      <ul className="pacientes-canais" aria-label={`Canais de ${paciente.nome}`}>
        {paciente.canais.map((item, indice) => (
          <li key={indice}>
            {ROTULO_CANAL[item.canal]} {item.contato}
            {item.preferido ? <Badge variant="secondary">Preferido</Badge> : null}
          </li>
        ))}
      </ul>
      {paciente.responsavel ? (
        <span className="pacientes-meta">Responsável {paciente.responsavel.nome}</span>
      ) : null}
    </div>
  );
}

function Campo({ rotulo, nota, children }: { rotulo: string; nota?: string; children: ReactNode }) {
  return (
    <Label className="pacientes-campo flex-col items-stretch gap-1.5">
      <span>
        {rotulo}
        {nota ? <span className="pacientes-nota"> ({nota})</span> : null}
      </span>
      {children}
    </Label>
  );
}

// Os campos são controlados: a resposta da action não apaga o que a pessoa digitou.
type Chave =
  | "nome"
  | "cpf"
  | "endereco"
  | "dataNascimento"
  | "sexo"
  | "responsavelNome"
  | "responsavelCpf"
  | "responsavelTelefone";

function Campos({ paciente }: { paciente?: PacienteLinha }) {
  const [valores, setValores] = useState<Record<Chave, string>>({
    nome: paciente?.nome ?? "",
    cpf: paciente?.cpf ?? "",
    endereco: paciente?.endereco ?? "",
    dataNascimento: paciente?.dataNascimento ?? "",
    sexo: paciente?.sexo ?? "",
    responsavelNome: paciente?.responsavel?.nome ?? "",
    responsavelCpf: paciente?.responsavel?.cpf ?? "",
    responsavelTelefone: paciente?.responsavel?.telefone ?? "",
  });
  const ligar = (chave: Chave) => ({
    name: chave,
    value: valores[chave],
    onChange: (evento: { target: { value: string } }) =>
      setValores((atual) => ({ ...atual, [chave]: evento.target.value })),
  });
  const menor = dataValida(valores.dataNascimento) && menorDeIdade(valores.dataNascimento, new Date());

  return (
    <>
      <Campo rotulo="Nome completo" nota="obrigatório">
        <Input {...ligar("nome")} required />
      </Campo>
      <Canais inicial={paciente?.canais} />
      <div className="pacientes-grade">
        <Campo rotulo="CPF" nota="opcional">
          <Input {...ligar("cpf")} inputMode="numeric" />
        </Campo>
        <Campo rotulo="Data de nascimento" nota="opcional">
          <Input {...ligar("dataNascimento")} type="date" />
        </Campo>
      </div>
      <Campo rotulo="Endereço" nota="opcional">
        <Input {...ligar("endereco")} />
      </Campo>
      <Campo rotulo="Sexo" nota="opcional">
        <NativeSelect {...ligar("sexo")}>
          <NativeSelectOption value="">Não informado</NativeSelectOption>
          {(["masculino", "feminino", "outro"] as const).map((sexo) => (
            <NativeSelectOption key={sexo} value={sexo}>
              {ROTULO_SEXO[sexo]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Campo>
      {menor ? (
        <fieldset className="pacientes-grupo">
          <legend>Responsável legal (obrigatório para menor de 18 anos)</legend>
          <Campo rotulo="Nome completo do responsável" nota="obrigatório">
            <Input {...ligar("responsavelNome")} required />
          </Campo>
          <div className="pacientes-grade">
            <Campo rotulo="CPF do responsável" nota="obrigatório">
              <Input {...ligar("responsavelCpf")} inputMode="numeric" required />
            </Campo>
            <Campo rotulo="Telefone do responsável" nota="opcional">
              <Input {...ligar("responsavelTelefone")} type="tel" />
            </Campo>
          </div>
        </fieldset>
      ) : null}
    </>
  );
}

// Lista de canais no formulário; vai ao servidor como JSON no campo `canais`.
function Canais({ inicial }: { inicial?: CanalComunicacao[] }) {
  const grupo = useId();
  const [linhas, setLinhas] = useState<CanalComunicacao[]>(
    inicial && inicial.length > 0 ? inicial : [LINHA_VAZIA],
  );

  function alterar(indice: number, mudanca: Partial<CanalComunicacao>) {
    setLinhas((atual) => atual.map((item, i) => (i === indice ? { ...item, ...mudanca } : item)));
  }

  function preferir(indice: number) {
    setLinhas((atual) => atual.map((item, i) => ({ ...item, preferido: i === indice })));
  }

  function remover(indice: number) {
    setLinhas((atual) => {
      const resto = atual.filter((_, i) => i !== indice);
      if (resto.length > 0 && !resto.some((item) => item.preferido)) resto[0] = { ...resto[0], preferido: true };
      return resto;
    });
  }

  return (
    <fieldset className="pacientes-grupo">
      <legend>Canais de comunicação (ao menos um; um preferido)</legend>
      <input type="hidden" name="canais" value={JSON.stringify(linhas)} />
      {linhas.map((linha, indice) => (
        <div key={indice} className="pacientes-canal">
          <NativeSelect
            value={linha.canal}
            onChange={(evento) => alterar(indice, { canal: evento.target.value as Canal })}
            aria-label={`Canal ${indice + 1}`}
          >
            {CANAIS_ORDEM.map((canal) => (
              <NativeSelectOption key={canal} value={canal}>
                {ROTULO_CANAL[canal]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Input
            value={linha.contato}
            onChange={(evento) => alterar(indice, { contato: evento.target.value })}
            aria-label={`Contato do canal ${indice + 1}`}
          />
          <label className="pacientes-preferido">
            <input
              type="radio"
              name={`${grupo}-preferido`}
              checked={linha.preferido}
              onChange={() => preferir(indice)}
            />
            Preferido
          </label>
          {linhas.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => remover(indice)}
              aria-label={`Remover canal ${indice + 1}`}
            >
              Remover canal
            </Button>
          ) : null}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="h-10 self-start"
        onClick={() => setLinhas((atual) => [...atual, { canal: "email", contato: "", preferido: false }])}
      >
        Adicionar canal
      </Button>
    </fieldset>
  );
}