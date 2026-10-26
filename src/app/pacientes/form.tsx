"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState } from "react";
import type { Canal, CanalComunicacao, Paciente } from "../../domain/paciente/tipos";
import { Aviso } from "../aviso";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { cadastrar, editar } from "./actions";

export type PacienteLinha = Paciente & { idade: number | null };

const ROTULO_CANAL: Record<Canal, string> = { sms: "SMS", email: "E-mail", whatsapp: "WhatsApp" };
const CANAIS_ORDEM: Canal[] = ["whatsapp", "email", "sms"];
const LINHA_VAZIA: CanalComunicacao = { canal: "whatsapp", contato: "", preferido: true };

export function Pacientes({ pacientes }: { pacientes: PacienteLinha[] }) {
  const roteador = useRouter();
  const [cadastro, acaoCadastrar, pendenteCadastrar] = useActionState(cadastrar, estadoVazio);
  const [edicao, acaoEditar, pendenteEditar] = useActionState(editar, estadoVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const aviso = avisoVisivel(cadastro, edicao);

  useEffect(() => {
    if (edicao.status === "sucesso") setEditandoId(null);
  }, [edicao]);

  useEffect(() => {
    if (cadastro.status === "sucesso" || edicao.status === "sucesso") roteador.refresh();
  }, [cadastro, edicao, roteador]);

  return (
    <>
      <Aviso tipo={aviso.status} mensagem={aviso.mensagem} />
      {pacientes.length === 0 ? (
        <p>Nenhum paciente cadastrado nesta clínica.</p>
      ) : (
        <ul className="lista">
          {pacientes.map((paciente) => (
            <li key={paciente.id}>
              <span>{resumo(paciente)}</span>
              <button
                type="button"
                onClick={() => setEditandoId(editandoId === paciente.id ? null : paciente.id)}
                aria-label={`Editar paciente ${paciente.nome}`}
              >
                Editar paciente
              </button>
              {editandoId === paciente.id ? (
                <form action={acaoEditar} aria-busy={pendenteEditar}>
                  <input type="hidden" name="id" value={paciente.id} />
                  <Campos paciente={paciente} />
                  <button type="submit" disabled={pendenteEditar}>
                    {pendenteEditar ? "Salvando…" : "Salvar paciente"}
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form
        key={cadastro.status === "sucesso" ? cadastro.quando : 0}
        action={acaoCadastrar}
        aria-busy={pendenteCadastrar}
      >
        <Campos />
        <button type="submit" disabled={pendenteCadastrar}>
          {pendenteCadastrar ? "Salvando…" : "Cadastrar paciente"}
        </button>
      </form>
    </>
  );
}

function resumo(paciente: PacienteLinha): string {
  const partes = [paciente.nome];
  if (paciente.idade !== null) partes.push(`${paciente.idade} anos`);
  partes.push(
    paciente.canais
      .map((item) => `${ROTULO_CANAL[item.canal]} ${item.contato}${item.preferido ? " (preferido)" : ""}`)
      .join(", "),
  );
  if (paciente.responsavel) partes.push(`Responsável ${paciente.responsavel.nome}`);
  return partes.join(" · ");
}

function Campos({ paciente }: { paciente?: PacienteLinha }) {
  return (
    <>
      <label>
        Nome
        <input name="nome" defaultValue={paciente?.nome} required />
      </label>
      <Canais inicial={paciente?.canais} />
      <label>
        CPF
        <input name="cpf" defaultValue={paciente?.cpf ?? ""} />
      </label>
      <label>
        Endereço
        <input name="endereco" defaultValue={paciente?.endereco ?? ""} />
      </label>
      <label>
        Data de nascimento
        <input name="dataNascimento" type="date" defaultValue={paciente?.dataNascimento ?? ""} />
      </label>
      <label>
        Sexo
        <select name="sexo" defaultValue={paciente?.sexo ?? ""}>
          <option value="">Não informado</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="outro">Outro</option>
        </select>
      </label>
      <fieldset>
        <legend>Responsável legal (obrigatório para menor de 18 anos)</legend>
        <label>
          Nome do responsável
          <input name="responsavelNome" defaultValue={paciente?.responsavel?.nome ?? ""} />
        </label>
        <label>
          CPF do responsável
          <input name="responsavelCpf" defaultValue={paciente?.responsavel?.cpf ?? ""} />
        </label>
        <label>
          Telefone do responsável
          <input
            name="responsavelTelefone"
            type="tel"
            defaultValue={paciente?.responsavel?.telefone ?? ""}
          />
        </label>
      </fieldset>
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
    <fieldset>
      <legend>Canais de comunicação</legend>
      <input type="hidden" name="canais" value={JSON.stringify(linhas)} />
      {linhas.map((linha, indice) => (
        <div key={indice} className="canal">
          <select
            value={linha.canal}
            onChange={(evento) => alterar(indice, { canal: evento.target.value as Canal })}
            aria-label={`Canal ${indice + 1}`}
          >
            {CANAIS_ORDEM.map((canal) => (
              <option key={canal} value={canal}>
                {ROTULO_CANAL[canal]}
              </option>
            ))}
          </select>
          <input
            value={linha.contato}
            onChange={(evento) => alterar(indice, { contato: evento.target.value })}
            aria-label={`Contato do canal ${indice + 1}`}
          />
          <label>
            <input
              type="radio"
              name={`${grupo}-preferido`}
              checked={linha.preferido}
              onChange={() => preferir(indice)}
            />
            Preferido
          </label>
          {linhas.length > 1 ? (
            <button type="button" onClick={() => remover(indice)} aria-label={`Remover canal ${indice + 1}`}>
              Remover canal
            </button>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setLinhas((atual) => [...atual, { canal: "email", contato: "", preferido: false }])}
      >
        Adicionar canal
      </button>
    </fieldset>
  );
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  const mensagem = escolhido.detalhe ? `${escolhido.mensagem}: ${escolhido.detalhe}` : escolhido.mensagem;
  return { status: escolhido.status, mensagem };
}
