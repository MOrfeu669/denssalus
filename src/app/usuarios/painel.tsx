"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { Usuario } from "../../domain/auth/tipos";
import { Aviso } from "../aviso";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { cadastrar, remover } from "./actions";

export function Painel({ usuarios, atualId }: { usuarios: Usuario[]; atualId: string }) {
  const roteador = useRouter();
  const [cadastro, acaoCadastro, pendenteCadastro] = useActionState(cadastrar, estadoVazio);
  const [remocao, acaoRemocao, pendenteRemocao] = useActionState(remover, estadoVazio);
  const aviso = avisoVisivel(cadastro, remocao);

  useEffect(() => {
    if (cadastro.status === "sucesso" || remocao.status === "sucesso") roteador.refresh();
  }, [cadastro, remocao, roteador]);

  return (
    <>
      <Aviso tipo={aviso.tipo} mensagem={aviso.mensagem} />
      <form action={acaoCadastro} aria-busy={pendenteCadastro}>
        <label>
          Nome
          <input name="nome" required />
        </label>
        <label>
          E-mail
          <input name="email" type="email" required />
        </label>
        <label>
          Senha
          <input name="senha" type="password" autoComplete="new-password" minLength={6} required />
        </label>
        <label>
          Papel
          <select name="papel" defaultValue="recepcionista">
            <option value="recepcionista">Recepcionista</option>
            <option value="dentista">Dentista</option>
          </select>
        </label>
        <button type="submit" disabled={pendenteCadastro}>
          {pendenteCadastro ? "Salvando…" : "Cadastrar usuário"}
        </button>
      </form>
      {usuarios.length === 0 ? (
        <p>Nenhum usuário cadastrado nesta clínica.</p>
      ) : (
        <ul className="lista">
          {usuarios.map((usuario) => (
            <li key={usuario.id}>
              <span>
                {usuario.nome} · {usuario.papel}
                {usuario.ativo ? "" : " · acesso removido"}
              </span>
              {usuario.ativo && usuario.id !== atualId ? (
                <form action={acaoRemocao}>
                  <input type="hidden" name="id" value={usuario.id} />
                  <button type="submit" disabled={pendenteRemocao}>
                    Remover acesso
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function avisoVisivel(cadastro: EstadoFormulario, remocao: EstadoFormulario) {
  const escolhido = cadastro.quando >= remocao.quando ? cadastro : remocao;
  return { tipo: escolhido.status, mensagem: escolhido.mensagem };
}
