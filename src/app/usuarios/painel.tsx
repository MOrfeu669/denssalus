"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { Papel, Usuario } from "../../domain/auth/tipos";
import { Checkbox } from "@/components/ui/checkbox";
import { rotuloPapel } from "../casca-menu";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { cadastrar, remover } from "./actions";
import { Alerta, BotaoAcao } from "./alerta";
import { filtrarUsuarios, PAPEIS_FILTRO } from "./filtrar";
import {
  mensagemComDetalhe,
  USUARIOS_BUSCA_PLACEHOLDER,
  USUARIOS_CONFIRMAR_REMOCAO,
  USUARIOS_FILTRO_VAZIO,
  USUARIOS_NOTA_REMOCAO,
  USUARIOS_VAZIO,
} from "./texto";

export function Painel({ usuarios, atualId }: { usuarios: Usuario[]; atualId: string }) {
  const roteador = useRouter();
  const botaoRef = useRef<HTMLButtonElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [papeis, setPapeis] = useState<Papel[]>([...PAPEIS_FILTRO]);
  const [confirmarId, setConfirmarId] = useState<string | null>(null);
  const [cadastro, acaoCadastro, pendenteCadastro] = useActionState(cadastrar, estadoVazio);
  const [remocao, acaoRemocao] = useActionState(remover, estadoVazio);
  const aviso = avisoVisivel(cadastro, remocao);
  const erroNoPainel = aberto && aviso.status === "erro" && aviso.quando === cadastro.quando;
  const visiveis = useMemo(
    () => filtrarUsuarios(usuarios, busca, papeis),
    [usuarios, busca, papeis],
  );
  const confirmando = confirmarId ? usuarios.find((u) => u.id === confirmarId) : null;

  useEffect(() => {
    if (cadastro.status === "sucesso") setAberto(false);
    if (cadastro.status === "sucesso" || remocao.status === "sucesso") {
      setConfirmarId(null);
      roteador.refresh();
    }
  }, [cadastro, remocao, roteador]);

  useEffect(() => {
    if (aberto) nomeRef.current?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !pendenteCadastro) {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aberto, pendenteCadastro]);

  function fechar() {
    if (pendenteCadastro) return;
    setAberto(false);
    botaoRef.current?.focus();
  }

  function alternarPapel(papel: Papel, ligado: boolean) {
    setPapeis((atuais) => {
      if (ligado) return atuais.includes(papel) ? atuais : [...atuais, papel];
      return atuais.filter((item) => item !== papel);
    });
  }

  return (
    <>
      <div className="usuarios-cabeca">
        <h1>Usuários</h1>
        <button
          ref={botaoRef}
          type="button"
          className="usuarios-botao"
          aria-haspopup="dialog"
          aria-expanded={aberto}
          aria-controls={aberto ? "usuarios-cadastro" : undefined}
          onClick={() => setAberto(true)}
        >
          Cadastrar usuário
        </button>
      </div>
      {erroNoPainel ? null : (
        <Alerta status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
      )}
      {aberto ? (
        <div className="usuarios-overlay">
          <div className="usuarios-overlay-fundo" onClick={fechar} />
          <section
            id="usuarios-cadastro"
            className="usuarios-painel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="usuarios-novo"
          >
            <div className="usuarios-painel-topo">
              <h2 id="usuarios-novo" className="usuarios-subtitulo">
                Cadastrar usuário
              </h2>
              <button type="button" className="usuarios-botao-sec" onClick={fechar}>
                Fechar
              </button>
            </div>
            {erroNoPainel ? (
              <Alerta status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
            ) : null}
            <form action={acaoCadastro} aria-busy={pendenteCadastro} className="usuarios-form">
              <label className="usuarios-campo">
                Nome
                <input ref={nomeRef} name="nome" required />
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
                <BotaoAcao rotulo="Cadastrar usuário" pendente="Salvando…" className="usuarios-botao" />
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {confirmando ? (
        <div className="usuarios-overlay">
          <div className="usuarios-overlay-fundo" onClick={() => setConfirmarId(null)} />
          <section
            className="usuarios-confirmar"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="usuarios-confirmar-titulo"
            aria-describedby="usuarios-confirmar-texto"
          >
            <h2 id="usuarios-confirmar-titulo" className="usuarios-subtitulo">
              Remover acesso
            </h2>
            <p id="usuarios-confirmar-texto" className="usuarios-confirmar-texto">
              {USUARIOS_CONFIRMAR_REMOCAO}
            </p>
            <p className="usuarios-confirmar-nome">{confirmando.nome}</p>
            <div className="usuarios-confirmar-acoes">
              <button
                type="button"
                className="usuarios-botao-sec"
                onClick={() => setConfirmarId(null)}
              >
                Cancelar
              </button>
              <form action={acaoRemocao}>
                <input type="hidden" name="id" value={confirmando.id} />
                <BotaoAcao
                  rotulo="Remover acesso"
                  pendente="Removendo…"
                  className="usuarios-botao-remover"
                  nomeAcessivel={`Confirmar remoção de acesso de ${confirmando.nome}`}
                />
              </form>
            </div>
          </section>
        </div>
      ) : null}
      <div className="usuarios-miolo">
        <aside className="usuarios-filtros" aria-label="Filtrar por papel">
          <p className="usuarios-filtros-titulo">Papel</p>
          <ul className="usuarios-filtros-lista">
            {PAPEIS_FILTRO.map((papel) => (
              <li key={papel}>
                <label className="usuarios-filtro-item">
                  <Checkbox
                    checked={papeis.includes(papel)}
                    onCheckedChange={(marcado) => alternarPapel(papel, marcado === true)}
                    aria-label={rotuloPapel(papel)}
                  />
                  <span>{rotuloPapel(papel)}</span>
                </label>
              </li>
            ))}
          </ul>
        </aside>
        <section className="usuarios-cartao" aria-labelledby="usuarios-lista">
          <h2 id="usuarios-lista" className="sr-only">
            Usuários da clínica
          </h2>
          <label className="usuarios-busca">
            <Search className="usuarios-busca-icone" aria-hidden="true" />
            <span className="sr-only">{USUARIOS_BUSCA_PLACEHOLDER}</span>
            <input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder={USUARIOS_BUSCA_PLACEHOLDER}
            />
          </label>
          {usuarios.length === 0 ? (
            <p className="usuarios-vazio">{USUARIOS_VAZIO}</p>
          ) : visiveis.length === 0 ? (
            <p className="usuarios-vazio">{USUARIOS_FILTRO_VAZIO}</p>
          ) : (
            <ul className="usuarios-lista">
              {visiveis.map((usuario) => (
                <li key={usuario.id} className="usuarios-linha">
                  <span className="usuarios-pessoa">
                    <span className="usuarios-avatar" aria-hidden="true">
                      {iniciais(usuario.nome)}
                    </span>
                    <span className="usuarios-nome">{usuario.nome}</span>
                    {usuario.ativo ? null : (
                      <span className="usuarios-removido">Acesso removido</span>
                    )}
                  </span>
                  <span className="usuarios-papel">{rotuloPapel(usuario.papel)}</span>
                  {usuario.ativo && usuario.id !== atualId ? (
                    <button
                      type="button"
                      className="usuarios-botao-remover"
                      aria-label={`Remover acesso de ${usuario.nome}`}
                      onClick={() => setConfirmarId(usuario.id)}
                    >
                      Remover acesso
                    </button>
                  ) : (
                    <span className="usuarios-remover-espaco" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="usuarios-nota">{USUARIOS_NOTA_REMOCAO}</p>
        </section>
      </div>
    </>
  );
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 1).toUpperCase();
  return `${partes[0].slice(0, 1)}${partes[partes.length - 1].slice(0, 1)}`.toUpperCase();
}

function avisoVisivel(cadastro: EstadoFormulario, remocao: EstadoFormulario) {
  const escolhido = cadastro.quando >= remocao.quando ? cadastro : remocao;
  return {
    status: escolhido.status,
    mensagem: mensagemComDetalhe(escolhido.mensagem, escolhido.detalhe),
    quando: escolhido.quando,
  };
}
