"use client";

import { ChevronDown, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { Procedimento } from "../../domain/procedimento/tipos";
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
import { cadastrar, editar, excluir } from "./actions";
import { AvisoLocal } from "./aviso";
import { Campos, valorDe } from "./campos";
import { filtrarProcedimentos, paginaDe } from "./filtrar";
import { VinculoMateriais, type MaterialOpcao } from "./materiais";
import { NOTA_ESTIMATIVA } from "./texto";

function parcial(item: EstadoFormulario) {
  return item.detalhe === "parcial";
}

export function Procedimentos({
  procedimentos,
  podeExcluir,
  materiais,
  cadastroAberto = false,
}: {
  procedimentos: Procedimento[];
  podeExcluir: boolean;
  materiais: MaterialOpcao[];
  cadastroAberto?: boolean;
}) {
  const roteador = useRouter();
  const nomeRef = useRef<HTMLInputElement>(null);
  const [cadastro, acaoCadastrar, pendenteCadastrar] = useActionState(cadastrar, estadoVazio);
  const [edicao, acaoEditar, pendenteEditar] = useActionState(editar, estadoVazio);
  const [exclusao, acaoExcluir, pendenteExcluir] = useActionState(excluir, estadoVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [aberto, setAberto] = useState(cadastroAberto);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const aviso = avisoVisivel(cadastro, edicao, exclusao);
  const erroNoPainel = aberto && aviso.status === "erro" && aviso.quando === cadastro.quando;
  const filtrados = useMemo(
    () => filtrarProcedimentos(procedimentos, busca),
    [procedimentos, busca],
  );
  const paginaAtual = useMemo(() => paginaDe(filtrados, pagina), [filtrados, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [busca]);

  useEffect(() => {
    if (edicao.status === "sucesso" || parcial(edicao)) setEditandoId(null);
    if (cadastro.status === "sucesso" || parcial(cadastro)) setAberto(false);
  }, [edicao, cadastro]);

  useEffect(() => {
    if ([cadastro, edicao, exclusao].some((item) => item.status === "sucesso" || parcial(item))) {
      roteador.refresh();
    }
  }, [cadastro, edicao, exclusao, roteador]);

  return (
    <>
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
        <div className="procedimentos-cabeca">
          <div>
            <h1>Procedimentos</h1>
            <p className="procedimentos-nota">{NOTA_ESTIMATIVA}</p>
          </div>
          <DialogTrigger className="procedimentos-botao h-11 shrink-0 px-5 text-[15px] font-semibold">
            Novo procedimento
          </DialogTrigger>
        </div>
        {erroNoPainel ? null : (
          <AvisoLocal tipo={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
        )}
        <DialogContent
          initialFocus={nomeRef}
          showCloseButton={false}
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto sm:max-w-3xl"
        >
          <div className="flex items-start justify-between gap-3">
            <DialogHeader className="pr-0">
              <DialogTitle>Novo procedimento</DialogTitle>
              <DialogDescription className="sr-only">{NOTA_ESTIMATIVA}</DialogDescription>
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
            <AvisoLocal tipo={aviso.status} mensagem={aviso.mensagem} quando={aviso.quando} />
          ) : null}
          <form
            className="procedimentos-form flex flex-col items-start gap-4"
            key={cadastro.status === "sucesso" ? cadastro.quando : 0}
            action={acaoCadastrar}
            aria-busy={pendenteCadastrar}
          >
            <VinculoMateriais materiais={materiais}>
              <Campos nomeRef={nomeRef} />
            </VinculoMateriais>
            <Button
              type="submit"
              className="procedimentos-botao h-11 px-5 text-[15px] font-semibold"
              disabled={pendenteCadastrar}
            >
              {pendenteCadastrar ? "Salvando…" : "Criar procedimento"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <section className="procedimentos-secao" aria-labelledby="procedimentos-titulo-lista">
        <div className="procedimentos-secao-topo">
          <h2 id="procedimentos-titulo-lista">Procedimentos da clínica</h2>
          <Label className="procedimentos-busca relative block font-normal">
            <Search className="procedimentos-busca-icone" aria-hidden="true" />
            <span className="sr-only">Buscar procedimentos</span>
            <Input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar procedimentos"
              className="h-10 pl-10"
            />
          </Label>
        </div>
        {procedimentos.length === 0 ? (
          <p className="procedimentos-vazio">Nenhum procedimento cadastrado nesta clínica.</p>
        ) : paginaAtual.itens.length === 0 ? (
          <p className="procedimentos-vazio">Nenhum procedimento encontrado com essa busca.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginaAtual.itens.map((procedimento) => (
                  <Fragment key={procedimento.id}>
                    <TableRow>
                      <TableCell className="font-semibold whitespace-normal">{procedimento.nome}</TableCell>
                      <TableCell>{procedimento.tempoMedioMinutos} min</TableCell>
                      <TableCell>{valorDe(procedimento)}</TableCell>
                      <TableCell className="text-right whitespace-normal">
                        <span className="inline-flex flex-wrap items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="procedimentos-botao procedimentos-botao-secundario h-10 px-3"
                            onClick={() =>
                              setEditandoId(editandoId === procedimento.id ? null : procedimento.id)
                            }
                            aria-label={`Editar procedimento ${procedimento.nome}`}
                            aria-expanded={editandoId === procedimento.id}
                          >
                            Editar
                          </Button>
                          {podeExcluir ? (
                            <form action={acaoExcluir} aria-busy={pendenteExcluir}>
                              <input type="hidden" name="id" value={procedimento.id} />
                              <Button
                                type="submit"
                                variant="destructive"
                                className="procedimentos-botao procedimentos-botao-perigo h-10 px-3"
                                disabled={pendenteExcluir}
                                aria-label={`Excluir procedimento ${procedimento.nome}`}
                              >
                                Excluir
                              </Button>
                            </form>
                          ) : null}
                        </span>
                      </TableCell>
                    </TableRow>
                    {editandoId === procedimento.id ? (
                      <TableRow>
                        <TableCell colSpan={4} className="whitespace-normal bg-papel">
                          <form
                            className="procedimentos-form flex flex-col items-start gap-4"
                            action={acaoEditar}
                            aria-busy={pendenteEditar}
                          >
                            <input type="hidden" name="id" value={procedimento.id} />
                            <VinculoMateriais materiais={materiais}>
                              <Campos procedimento={procedimento} />
                            </VinculoMateriais>
                            <Button
                              type="submit"
                              className="procedimentos-botao h-11 px-5 font-semibold"
                              disabled={pendenteEditar}
                            >
                              {pendenteEditar ? "Salvando…" : "Salvar procedimento"}
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
            <div className="procedimentos-paginacao">
              <p className="procedimentos-rodape">
                Mostrando {paginaAtual.itens.length} de {paginaAtual.total}
              </p>
              {paginaAtual.temMais ? (
                <Button
                  type="button"
                  variant="outline"
                  className="procedimentos-mais h-10 gap-2 px-4"
                  onClick={() => setPagina((atual) => atual + 1)}
                  aria-label="Mostrar mais procedimentos"
                >
                  <ChevronDown aria-hidden="true" />
                  Ver mais
                </Button>
              ) : null}
            </div>
          </>
        )}
      </section>
    </>
  );
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  const mensagem =
    escolhido.detalhe && escolhido.detalhe !== "parcial"
      ? `${escolhido.mensagem}: ${escolhido.detalhe}`
      : escolhido.mensagem;
  return { status: escolhido.status, mensagem, quando: escolhido.quando };
}
