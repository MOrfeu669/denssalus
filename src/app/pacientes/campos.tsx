"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { dataValida, menorDeIdade } from "../../domain/paciente/regras";
import type { Canal, CanalComunicacao } from "../../domain/paciente/tipos";
import type { PacienteLinha } from "./linha";
import { ROTULO_CANAL, ROTULO_SEXO } from "./texto";

const CANAIS_ORDEM: Canal[] = ["whatsapp", "email", "sms"];
const LINHA_VAZIA: CanalComunicacao = { canal: "whatsapp", contato: "", preferido: true };

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

type Chave =
  | "nome"
  | "cpf"
  | "endereco"
  | "dataNascimento"
  | "sexo"
  | "responsavelNome"
  | "responsavelCpf"
  | "responsavelTelefone";

export function Campos({ paciente }: { paciente?: PacienteLinha }) {
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
