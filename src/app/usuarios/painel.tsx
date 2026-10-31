"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { Usuario } from "../../domain/auth/tipos";
import { rotuloPapel } from "../casca-menu";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { cadastrar, remover } from "./actions";
import { Alerta, BotaoAcao } from "./alerta";
import { mensagemComDetalhe, USUARIOS_NOTA_REMOCAO, USUARIOS_VAZIO } from "./texto";

export function Painel({ usuarios, atualId }: { usuarios: Usuario[]; atualId: string }) {
  const roteador = useRouter();
  const [cadastro, acaoCadastro, pendenteCadastro] = useActionState(cadastrar, estadoVazio);
  const [remocao, acaoRemocao] = useActionState(remover, estadoVazio);
  const aviso = avisoVisivel(cadastro, remocao);

  useEffect(() => {
    if (cadastro.status === "sucesso" || remocao.status === "sucesso") roteador.refresh();
  }, [cadastro, remocao, roteador]);

  return (
    <>
      <Alerta status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
      <section className="usuarios-cartao" aria-labelledby="usuarios-novo">
        <h2 id="usuarios-novo" className="usuarios-subtitulo">
          Cadastrar usuário
        </h2>
        <form action={acaoCadastro} aria-busy={pendenteCadastro} className="usuarios-form">
          <label className="usuarios-campo">
            Nome
            <input name="nome" required />
          </label>
          <label className="usuarios-campo">
            E-mail
            <input name="email" type="email" required />
          </label>
          <label className="usuarios-campo">
            Senha
            <input name="senha" type="password" autoComplete="new-password" minLength={6} required />
          </label>
          <label className="usuarios-campo">
            Papel
            <select name="papel" defaultValue="recepcionista">
              <option value="recepcionista">Recepcionista</option>
              <option value="dentista">Dentista</option>
            </select>
          </label>
          <div className="usuarios-acoes">
            <BotaoAcao
              rotulo="Cadastrar usuário"
              pendente="Salvando…"
              className="usuarios-botao"
            />
          </div>
        </form>
      </section>
      <section className="usuarios-cartao" aria-labelledby="usuarios-lista">
        <h2 id="usuarios-lista" className="usuarios-subtitulo">
          Usuários da clínica
        </h2>
        {usuarios.length === 0 ? (
          <p className="usuarios-vazio">{USUARIOS_VAZIO}</p>
        ) : (
          <ul className="usuarios-lista">
            {usuarios.map((usuario) => (
              <li key={usuario.id} className="usuarios-linha">
                <span className="usuarios-pessoa">
                  <span className="usuarios-nome">{usuario.nome}</span>
                  <span className="usuarios-papel">{rotuloPapel(usuario.papel)}</span>
                  {usuario.ativo ? null : (
                    <span className="usuarios-removido">Acesso removido</span>
                  )}
                </span>
                {usuario.ativo && usuario.id !== atualId ? (
                  <form action={acaoRemocao} className="usuarios-remover">
                    <input type="hidden" name="id" value={usuario.id} />
                    <BotaoAcao
                      rotulo="Remover acesso"
                      pendente="Removendo…"
                      className="usuarios-botao-sec"
                      nomeAcessivel={`Remover acesso de ${usuario.nome}`}
                    />
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="usuarios-nota">{USUARIOS_NOTA_REMOCAO}</p>
      </section>
    </>
  );
}

function avisoVisivel(cadastro: EstadoFormulario, remocao: EstadoFormulario) {
  const escolhido = cadastro.quando >= remocao.quando ? cadastro : remocao;
  return {
    status: escolhido.status,
    mensagem: mensagemComDetalhe(escolhido.mensagem, escolhido.detalhe),
    quando: escolhido.quando,
  };
}
