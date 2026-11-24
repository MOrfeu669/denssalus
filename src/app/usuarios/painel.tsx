"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { Papel, Usuario } from "../../domain/auth/tipos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const campo = "w-full flex-col items-stretch gap-2 font-semibold";

export function Painel({ usuarios, atualId }: { usuarios: Usuario[]; atualId: string }) {
  const roteador = useRouter();
  const nomeRef = useRef<HTMLInputElement>(null);
  const alertaRef = useRef<HTMLDivElement>(null);
  const ultimoRemovido = useRef<Usuario | null>(null);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [papeis, setPapeis] = useState<Papel[]>([...PAPEIS_FILTRO]);
  const [confirmarId, setConfirmarId] = useState<string | null>(null);
  const [cadastro, acaoCadastro, pendenteCadastro] = useActionState(cadastrar, estadoVazio);
  const [remocao, acaoRemocao, pendenteRemocao] = useActionState(remover, estadoVazio);
  const aviso = avisoVisivel(cadastro, remocao);
  const erroNoPainel = aberto && aviso.status === "erro" && aviso.quando === cadastro.quando;
  const visiveis = useMemo(
    () => filtrarUsuarios(usuarios, busca, papeis),
    [usuarios, busca, papeis],
  );
  const confirmando = confirmarId ? usuarios.find((u) => u.id === confirmarId) ?? null : null;
  if (confirmando) ultimoRemovido.current = confirmando;
  const alvoRemocao = confirmando ?? ultimoRemovido.current;

  useEffect(() => {
    if (cadastro.status === "sucesso") {
      setAberto(false);
      setConfirmarId(null);
      roteador.refresh();
    }
  }, [cadastro, roteador]);

  useEffect(() => {
    if (remocao.status === "vazio") return;
    setConfirmarId(null);
    if (remocao.status === "sucesso") roteador.refresh();
  }, [remocao, roteador]);

  function alternarPapel(papel: Papel, ligado: boolean) {
    setPapeis((atuais) => {
      if (ligado) return atuais.includes(papel) ? atuais : [...atuais, papel];
      return atuais.filter((item) => item !== papel);
    });
  }

  return (
    <>
      <Dialog
        open={aberto}
        disablePointerDismissal={pendenteCadastro}
        onOpenChange={(proximo, detalhes) => {
          if (!proximo && pendenteCadastro) {
            detalhes.cancel();
            return;
          }
          setAberto(proximo);
        }}
      >
        <div className="usuarios-cabeca">
          <h1>Usuários</h1>
          <DialogTrigger className="usuarios-botao h-11 px-5 text-[15px] font-semibold">
            Cadastrar usuário
          </DialogTrigger>
        </div>
        {erroNoPainel ? null : (
          <Alerta ref={alertaRef} status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
        )}
        <DialogContent
          initialFocus={nomeRef}
          showCloseButton={false}
          className="top-20 right-6 left-auto max-h-[calc(100dvh-6rem)] w-[min(420px,calc(100%-2rem))] translate-x-0 translate-y-0 overflow-y-auto sm:max-w-[420px]"
        >
          <div className="flex items-start justify-between gap-3">
            <DialogHeader className="pr-0">
              <DialogTitle>Cadastrar usuário</DialogTitle>
              <DialogDescription className="sr-only">
                Informe nome, e-mail, senha e papel deste acesso.
              </DialogDescription>
            </DialogHeader>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 shrink-0 px-3"
                  disabled={pendenteCadastro}
                />
              }
            >
              Fechar
            </DialogClose>
          </div>
          {erroNoPainel ? (
            <Alerta ref={alertaRef} status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
          ) : null}
          <form action={acaoCadastro} aria-busy={pendenteCadastro} className="flex flex-col gap-4">
            <Label className={campo}>
              Nome
              <Input ref={nomeRef} name="nome" required />
            </Label>
            <Label className={campo}>
              E-mail
              <Input name="email" type="email" required />
            </Label>
            <Label className={campo}>
              Senha
              <Input name="senha" type="password" autoComplete="new-password" minLength={6} required />
            </Label>
            <Label className={campo}>
              Papel
              <NativeSelect name="papel" defaultValue="recepcionista">
                <NativeSelectOption value="recepcionista">Recepcionista</NativeSelectOption>
                <NativeSelectOption value="dentista">Dentista</NativeSelectOption>
              </NativeSelect>
            </Label>
            <div className="flex">
              <BotaoAcao rotulo="Cadastrar usuário" pendente="Salvando…" className="usuarios-botao" />
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={confirmando !== null}
        triggerId={confirmarId}
        disablePointerDismissal={pendenteRemocao}
        onOpenChange={(proximo, detalhes) => {
          if (!proximo && pendenteRemocao) {
            detalhes.cancel();
            return;
          }
          setConfirmarId(proximo ? detalhes.trigger?.id ?? confirmarId : null);
        }}
      >
        <div className="usuarios-miolo">
          <aside className="usuarios-filtros" aria-label="Filtrar por papel">
            <p className="usuarios-filtros-titulo">Papel</p>
            <ul className="usuarios-filtros-lista">
              {PAPEIS_FILTRO.map((papel) => (
                <li key={papel}>
                  <Label className="usuarios-filtro-item cursor-pointer font-semibold">
                    <Checkbox
                      checked={papeis.includes(papel)}
                      onCheckedChange={(marcado) => alternarPapel(papel, marcado === true)}
                      aria-label={rotuloPapel(papel)}
                    />
                    <span>{rotuloPapel(papel)}</span>
                  </Label>
                </li>
              ))}
            </ul>
          </aside>
          <section className="usuarios-cartao" aria-labelledby="usuarios-lista">
            <h2 id="usuarios-lista" className="sr-only">
              Usuários da clínica
            </h2>
            <Label className="usuarios-busca relative mb-4 block font-normal">
              <Search className="usuarios-busca-icone" aria-hidden="true" />
              <span className="sr-only">{USUARIOS_BUSCA_PLACEHOLDER}</span>
              <Input
                type="search"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder={USUARIOS_BUSCA_PLACEHOLDER}
                className="h-10 pl-10"
              />
            </Label>
            {usuarios.length === 0 ? (
              <p className="usuarios-vazio">{USUARIOS_VAZIO}</p>
            ) : visiveis.length === 0 ? (
              <p className="usuarios-vazio">{USUARIOS_FILTRO_VAZIO}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead className="text-right">Acesso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="whitespace-normal">
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span
                            className="inline-grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary"
                            aria-hidden="true"
                          >
                            {iniciais(usuario.nome)}
                          </span>
                          <span className="font-semibold wrap-anywhere">{usuario.nome}</span>
                          {usuario.ativo ? null : (
                            <Badge variant="destructive">Acesso removido</Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rotuloPapel(usuario.papel)}</Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-normal">
                        {usuario.ativo && usuario.id !== atualId ? (
                          <DialogTrigger
                            id={usuario.id}
                            className="usuarios-botao-remover h-9 border-perigo bg-perigo-fundo px-3 text-sm font-semibold text-perigo-tinta hover:bg-perigo-fundo"
                            aria-label={`Remover acesso de ${usuario.nome}`}
                          >
                            Remover acesso
                          </DialogTrigger>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <p className="usuarios-nota">{USUARIOS_NOTA_REMOCAO}</p>
          </section>
        </div>
        {alvoRemocao ? (
          <DialogContent
            role="alertdialog"
            showCloseButton={false}
            className="sm:max-w-[420px]"
          >
            <DialogHeader>
              <DialogTitle>Remover acesso</DialogTitle>
              <DialogDescription>{USUARIOS_CONFIRMAR_REMOCAO}</DialogDescription>
            </DialogHeader>
            <p className="font-semibold text-tinta">{alvoRemocao.nome}</p>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" className="h-9 px-3" />}>
                Cancelar
              </DialogClose>
              <form action={acaoRemocao}>
                <input type="hidden" name="id" value={alvoRemocao.id} />
                <BotaoAcao
                  rotulo="Remover acesso"
                  pendente="Removendo…"
                  className="usuarios-botao-remover"
                  variante="destructive"
                  nomeAcessivel={`Confirmar remoção de acesso de ${alvoRemocao.nome}`}
                />
              </form>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
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
