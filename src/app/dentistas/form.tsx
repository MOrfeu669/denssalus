"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { Dentista } from "../../domain/dentista/tipos";
import { Aviso } from "../aviso";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { cadastrar, editar, remover } from "./actions";

export function Dentistas({ dentistas }: { dentistas: Dentista[] }) {
  const roteador = useRouter();
  const [cadastro, acaoCadastrar, pendenteCadastrar] = useActionState(cadastrar, estadoVazio);
  const [edicao, acaoEditar, pendenteEditar] = useActionState(editar, estadoVazio);
  const [remocao, acaoRemover, pendenteRemover] = useActionState(remover, estadoVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const aviso = avisoVisivel(cadastro, edicao, remocao);

  useEffect(() => {
    if (edicao.status === "sucesso") setEditandoId(null);
  }, [edicao]);

  useEffect(() => {
    const estados = [cadastro, edicao, remocao];
    if (estados.some((item) => item.status === "sucesso")) roteador.refresh();
  }, [cadastro, edicao, remocao, roteador]);

  return (
    <>
      <Aviso tipo={aviso.status} mensagem={aviso.mensagem} />
      {dentistas.length === 0 ? (
        <p>Nenhum dentista cadastrado nesta clínica.</p>
      ) : (
        <ul className="lista">
          {dentistas.map((dentista) => (
            <li key={dentista.id}>
              <span>
                {dentista.nome} · CRO {dentista.cro} · {dentista.telefone}
                {dentista.especialidades.length > 0
                  ? ` · ${dentista.especialidades.join(", ")}`
                  : ""}
                {dentista.ativo ? "" : " · ! removido"}
              </span>
              {dentista.ativo ? (
                <>
                  <button
                    type="button"
                    onClick={() => setEditandoId(editandoId === dentista.id ? null : dentista.id)}
                    aria-label={`Editar dentista ${dentista.nome}`}
                  >
                    Editar dentista
                  </button>
                  <form action={acaoRemover}>
                    <input type="hidden" name="id" value={dentista.id} />
                    <button
                      type="submit"
                      disabled={pendenteRemover}
                      aria-label={`Remover dentista ${dentista.nome}`}
                    >
                      Remover dentista
                    </button>
                  </form>
                </>
              ) : null}
              {dentista.ativo && editandoId === dentista.id ? (
                <form action={acaoEditar} aria-busy={pendenteEditar}>
                  <input type="hidden" name="id" value={dentista.id} />
                  <Campos dentista={dentista} />
                  <button type="submit" disabled={pendenteEditar}>
                    {pendenteEditar ? "Salvando…" : "Salvar dentista"}
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form action={acaoCadastrar} aria-busy={pendenteCadastrar}>
        <Campos />
        <label>
          E-mail
          <input name="email" type="email" autoComplete="off" required />
        </label>
        <label>
          Senha
          <input name="senha" type="password" autoComplete="new-password" minLength={6} required />
        </label>
        <button type="submit" disabled={pendenteCadastrar}>
          {pendenteCadastrar ? "Salvando…" : "Cadastrar dentista"}
        </button>
      </form>
    </>
  );
}

function Campos({ dentista }: { dentista?: Dentista }) {
  return (
    <>
      <label>
        Nome
        <input name="nome" defaultValue={dentista?.nome} required />
      </label>
      <label>
        CRO
        <input name="cro" defaultValue={dentista?.cro} required />
      </label>
      <label>
        Telefone
        <input name="telefone" type="tel" defaultValue={dentista?.telefone} required />
      </label>
      <label>
        CPF
        <input name="cpf" defaultValue={dentista?.cpf} required />
      </label>
      <label>
        Especialidades (separadas por vírgula)
        <input name="especialidades" defaultValue={dentista?.especialidades.join(", ")} />
      </label>
    </>
  );
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  const mensagem = escolhido.detalhe ? `${escolhido.mensagem}: ${escolhido.detalhe}` : escolhido.mensagem;
  return { status: escolhido.status, mensagem };
}
