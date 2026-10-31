"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState, type ReactNode } from "react";
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
  const aviso = cadastro.quando >= edicao.quando ? cadastro : edicao;

  useEffect(() => {
    if (edicao.status === "sucesso") setEditandoId(null);
  }, [edicao]);

  useEffect(() => {
    if (cadastro.status === "sucesso" || edicao.status === "sucesso") roteador.refresh();
  }, [cadastro, edicao, roteador]);

  return (
    <>
      <Alerta estado={aviso} />
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
                      <button
                        type="button"
                        className="pacientes-botao pacientes-botao-secundario"
                        aria-expanded={editandoId === paciente.id}
                        onClick={() => setEditandoId(editandoId === paciente.id ? null : paciente.id)}
                        aria-label={`Editar paciente ${paciente.nome}`}
                      >
                        Editar paciente
                      </button>
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
        <section className="pacientes-secao" aria-labelledby="pacientes-novo-titulo">
          <h2 id="pacientes-novo-titulo">Novo paciente</h2>
          <form
            className="pacientes-form"
            key={cadastro.status === "sucesso" ? cadastro.quando : 0}
            action={acaoCadastrar}
            aria-busy={pendenteCadastrar}
          >
            <Campos />
            <Enviar pendente={pendenteCadastrar} texto="Cadastrar paciente" />
          </form>
        </section>
      </div>
    </>
  );
}

function Enviar({ pendente, texto }: { pendente: boolean; texto: string }) {
  return (
    <button type="submit" className="pacientes-botao" disabled={pendente}>
      {pendente ? "Salvando…" : texto}
    </button>
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
            {item.preferido ? <span className="pacientes-selo">Preferido</span> : null}
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
    <label className="pacientes-campo">
      <span>
        {rotulo}
        {nota ? <span className="pacientes-nota"> ({nota})</span> : null}
      </span>
      {children}
    </label>
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
        <input {...ligar("nome")} required />
      </Campo>
      <Canais inicial={paciente?.canais} />
      <div className="pacientes-grade">
        <Campo rotulo="CPF" nota="opcional">
          <input {...ligar("cpf")} inputMode="numeric" />
        </Campo>
        <Campo rotulo="Data de nascimento" nota="opcional">
          <input {...ligar("dataNascimento")} type="date" />
        </Campo>
      </div>
      <Campo rotulo="Endereço" nota="opcional">
        <input {...ligar("endereco")} />
      </Campo>
      <Campo rotulo="Sexo" nota="opcional">
        <select {...ligar("sexo")}>
          <option value="">Não informado</option>
          {(["masculino", "feminino", "outro"] as const).map((sexo) => (
            <option key={sexo} value={sexo}>
              {ROTULO_SEXO[sexo]}
            </option>
          ))}
        </select>
      </Campo>
      {menor ? (
        <fieldset className="pacientes-grupo">
          <legend>Responsável legal (obrigatório para menor de 18 anos)</legend>
          <Campo rotulo="Nome completo do responsável" nota="obrigatório">
            <input {...ligar("responsavelNome")} required />
          </Campo>
          <div className="pacientes-grade">
            <Campo rotulo="CPF do responsável" nota="obrigatório">
              <input {...ligar("responsavelCpf")} inputMode="numeric" required />
            </Campo>
            <Campo rotulo="Telefone do responsável" nota="opcional">
              <input {...ligar("responsavelTelefone")} type="tel" />
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
            <button
              type="button"
              className="pacientes-botao pacientes-botao-secundario"
              onClick={() => remover(indice)}
              aria-label={`Remover canal ${indice + 1}`}
            >
              Remover canal
            </button>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        className="pacientes-botao pacientes-botao-secundario"
        onClick={() => setLinhas((atual) => [...atual, { canal: "email", contato: "", preferido: false }])}
      >
        Adicionar canal
      </button>
    </fieldset>
  );
}