"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { Dentista } from "../../domain/dentista/tipos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { cadastrar, editar, remover } from "./actions";
import { Alerta, BotaoAcao } from "./alerta";
import { Campos } from "./campos";
import { filtrarDentistas } from "./filtrar";
import { DENTISTAS_NOTA, DENTISTAS_VAZIO, mensagemComDetalhe } from "./texto";

const campo = "dentistas-campo w-full flex-col items-stretch gap-2 font-semibold";

export function Dentistas({ dentistas }: { dentistas: Dentista[] }) {
  const roteador = useRouter();
  const nomeRef = useRef<HTMLInputElement>(null);
  const [cadastro, acaoCadastrar, pendenteCadastrar] = useActionState(cadastrar, estadoVazio);
  const [edicao, acaoEditar, pendenteEditar] = useActionState(editar, estadoVazio);
  const [remocao, acaoRemover] = useActionState(remover, estadoVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const aviso = avisoVisivel(cadastro, edicao, remocao);
  const erroNoPainel = aberto && aviso.status === "erro" && aviso.quando === cadastro.quando;
  const visiveis = useMemo(() => filtrarDentistas(dentistas, busca), [dentistas, busca]);

  useEffect(() => {
    if (edicao.status === "sucesso") setEditandoId(null);
    if (cadastro.status === "sucesso") setAberto(false);
  }, [edicao, cadastro]);

  useEffect(() => {
    const estados = [cadastro, edicao, remocao];
    if (estados.some((item) => item.status === "sucesso")) roteador.refresh();
  }, [cadastro, edicao, remocao, roteador]);

  return (
    <>
      <div className="dentistas-cabeca">
        <h1>Dentistas</h1>
      </div>
      {erroNoPainel ? null : (
        <Alerta status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
      )}
      <Dialog
        open={aberto}
        disablePointerDismissal={pendenteCadastrar}
        onOpenChange={(proximo, detalhes) => {
          if (!proximo && pendenteCadastrar) {
            detalhes.cancel();
            return;
          }
          setAberto(proximo);
        }}
      >
        <div className="dentistas-ferramentas">
          <Label className="dentistas-busca relative block flex-1 font-normal">
            <Search className="dentistas-busca-icone" aria-hidden="true" />
            <span className="sr-only">Buscar por nome</span>
            <Input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por nome"
              className="h-10 pl-10"
            />
          </Label>
          <DialogTrigger className="dentistas-botao h-11 shrink-0 px-5 text-[15px] font-semibold">
            Cadastrar dentista
          </DialogTrigger>
        </div>
        <DialogContent
          initialFocus={nomeRef}
          showCloseButton={false}
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto sm:max-w-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <DialogHeader className="pr-0">
              <DialogTitle>Cadastrar dentista</DialogTitle>
            </DialogHeader>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 shrink-0 px-3"
                  disabled={pendenteCadastrar}
                />
              }
            >
              Fechar
            </DialogClose>
          </div>
          {erroNoPainel ? (
            <Alerta status={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
          ) : null}
          <form
            action={acaoCadastrar}
            aria-busy={pendenteCadastrar}
            className="dentistas-form grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <Campos nomeRef={nomeRef} />
            <Label className={campo}>
              E-mail
              <Input name="email" type="email" autoComplete="off" required />
            </Label>
            <Label className={campo}>
              Senha
              <Input name="senha" type="password" autoComplete="new-password" minLength={6} required />
            </Label>
            <div className="dentistas-acoes flex sm:col-span-2">
              <BotaoAcao rotulo="Cadastrar dentista" pendente="Salvando…" className="dentistas-botao" />
            </div>
          </form>
          <DialogDescription>{DENTISTAS_NOTA}</DialogDescription>
        </DialogContent>
      </Dialog>
      <section className="dentistas-cartao" aria-labelledby="dentistas-lista">
        <h2 id="dentistas-lista" className="dentistas-subtitulo">
          Dentistas da clínica
        </h2>
        {dentistas.length === 0 ? (
          <p className="dentistas-vazio">{DENTISTAS_VAZIO}</p>
        ) : visiveis.length === 0 ? (
          <p className="dentistas-vazio">Nenhum dentista encontrado com esse nome.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dentista</TableHead>
                  <TableHead>CRO</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((dentista) => (
                  <Fragment key={dentista.id}>
                    <TableRow>
                      <TableCell className="whitespace-normal">
                        <span className="flex items-center gap-3">
                          <span
                            className="inline-grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary"
                            aria-hidden="true"
                          >
                            {iniciais(dentista.nome)}
                          </span>
                          <span className="font-semibold wrap-anywhere">{dentista.nome}</span>
                        </span>
                      </TableCell>
                      <TableCell>{dentista.cro}</TableCell>
                      <TableCell>
                        <Badge variant={dentista.ativo ? "success" : "warning"}>
                          {dentista.ativo ? "Ativo" : "! Removido"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal text-apagado">
                        {dentista.telefone}
                        {dentista.especialidades.length > 0
                          ? ` · ${dentista.especialidades.join(", ")}`
                          : ""}
                      </TableCell>
                      <TableCell className="text-right whitespace-normal">
                        {dentista.ativo ? (
                          <span className="inline-flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="dentistas-botao-sec h-9 px-3"
                              aria-expanded={editandoId === dentista.id}
                              aria-label={`Editar dentista ${dentista.nome}`}
                              onClick={() =>
                                setEditandoId(editandoId === dentista.id ? null : dentista.id)
                              }
                            >
                              Editar
                            </Button>
                            <form action={acaoRemover} className="dentistas-remover">
                              <input type="hidden" name="id" value={dentista.id} />
                              <BotaoAcao
                                rotulo="Remover"
                                pendente="Removendo…"
                                className="dentistas-botao-sec"
                                variante="outline"
                                nomeAcessivel={`Remover dentista ${dentista.nome}`}
                              />
                            </form>
                          </span>
                        ) : null}
                      </TableCell>
                    </TableRow>
                    {dentista.ativo && editandoId === dentista.id ? (
                      <TableRow>
                        <TableCell colSpan={5} className="whitespace-normal bg-papel">
                          <form
                            action={acaoEditar}
                            aria-busy={pendenteEditar}
                            className="dentistas-form dentistas-edicao grid grid-cols-1 gap-4 sm:grid-cols-2"
                          >
                            <input type="hidden" name="id" value={dentista.id} />
                            <Campos dentista={dentista} />
                            <div className="dentistas-acoes flex sm:col-span-2">
                              <BotaoAcao
                                rotulo="Salvar dentista"
                                pendente="Salvando…"
                                className="dentistas-botao"
                              />
                            </div>
                          </form>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
            <p className="dentistas-rodape">
              Mostrando {visiveis.length} de {dentistas.length} dentistas
            </p>
          </>
        )}
      </section>
    </>
  );
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 1).toUpperCase();
  return `${partes[0].slice(0, 1)}${partes[partes.length - 1].slice(0, 1)}`.toUpperCase();
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  return {
    status: escolhido.status,
    mensagem: mensagemComDetalhe(escolhido.mensagem, escolhido.detalhe),
    quando: escolhido.quando,
  };
}
