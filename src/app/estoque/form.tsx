"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Aviso } from "../aviso";
import { estadoVazio, type EstadoFormulario } from "../formulario";
import { cadastrarMaterial, reabastecerMaterial } from "./actions";
import { Historico } from "./historico";

export type MovimentoTela = {
  id: string;
  tipo: string;
  quantidade: number;
  usuario: string;
  registradoEm: string;
};

export type MaterialTela = {
  id: string;
  nome: string;
  quantidade: number;
  quantidadeMinima: number;
  historico: MovimentoTela[];
};

export function Estoque({ materiais }: { materiais: MaterialTela[] }) {
  const roteador = useRouter();
  const nomeRef = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [cadastro, acaoCadastrar, pendenteCadastrar] = useActionState(cadastrarMaterial, estadoVazio);
  const [reposicao, acaoReabastecer, pendenteReabastecer] = useActionState(
    reabastecerMaterial,
    estadoVazio,
  );
  const aviso = avisoVisivel(cadastro, reposicao);
  const erroNoPainel = aberto && aviso.status === "erro" && aviso.quando === cadastro.quando;

  useEffect(() => {
    if (cadastro.status === "sucesso") setAberto(false);
  }, [cadastro]);

  useEffect(() => {
    if ([cadastro, reposicao].some((item) => item.status === "sucesso")) roteador.refresh();
  }, [cadastro, reposicao, roteador]);

  function aoAbrir(proximo: boolean, detalhes: { cancel: () => void }) {
    if (!proximo && pendenteCadastrar) {
      detalhes.cancel();
      return;
    }
    setAberto(proximo);
  }

  return (
    <>
      <div className="estoque-cabeca">
        <h1>Estoque</h1>
        <Dialog open={aberto} onOpenChange={aoAbrir}>
          <DialogTrigger render={<Button type="button" className="estoque-botao h-10 px-4" />}>
            Novo material
          </DialogTrigger>
          <DialogContent
            className="max-h-[calc(100vh-3rem)] overflow-auto sm:max-w-xl"
            initialFocus={nomeRef}
          >
            <DialogHeader>
              <DialogTitle>Novo material</DialogTitle>
              <DialogDescription>Informe o nome, a quantidade, o mínimo e a validade.</DialogDescription>
            </DialogHeader>
            {erroNoPainel ? <Aviso key={aviso.quando} tipo={aviso.status} mensagem={aviso.mensagem} /> : null}
            <form
              className="flex flex-col gap-4"
              key={cadastro.status === "sucesso" ? cadastro.quando : 0}
              action={acaoCadastrar}
              aria-busy={pendenteCadastrar}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Label className="flex-col items-start gap-1.5">
                  Nome
                  <Input ref={nomeRef} name="nome" required />
                </Label>
                <Label className="flex-col items-start gap-1.5">
                  Quantidade
                  <Input name="quantidade" type="number" min={1} step={1} required />
                </Label>
                <Label className="flex-col items-start gap-1.5">
                  Quantidade mínima
                  <Input name="quantidadeMinima" type="number" min={0} step={1} required />
                </Label>
                <Label className="flex-col items-start gap-1.5">
                  Validade
                  <Input name="validade" type="date" required />
                </Label>
              </div>
              <DialogFooter>
                <Button type="submit" className="h-10 px-4" disabled={pendenteCadastrar}>
                  {pendenteCadastrar ? "Salvando…" : "Cadastrar material"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {erroNoPainel ? null : <Aviso key={aviso.quando} tipo={aviso.status} mensagem={aviso.mensagem} />}
      <section className="estoque-secao" aria-labelledby="estoque-titulo-lista">
        <h2 id="estoque-titulo-lista">Materiais da clínica</h2>
        {materiais.length === 0 ? (
          <p className="estoque-vazio">Nenhum material cadastrado nesta clínica.</p>
        ) : (
          <ul className="estoque-lista">
            {materiais.map((material) => {
              const abaixo = material.quantidade < material.quantidadeMinima;
              return (
                <li
                  key={material.id}
                  className={abaixo ? "estoque-item estoque-item-abaixo abaixo" : "estoque-item"}
                >
                  <div className="estoque-resumo">
                    <span className="estoque-nome">{material.nome}</span>
                    <span className="estoque-quantidade">{`Quantidade válida: ${material.quantidade}`}</span>
                    <span className="estoque-minimo">{`Quantidade mínima: ${material.quantidadeMinima}`}</span>
                    {abaixo ? (
                      <Badge variant="destructive" className="border-perigo bg-card text-perigo-tinta">
                        Abaixo do mínimo
                      </Badge>
                    ) : null}
                  </div>
                  <form
                    className="estoque-form estoque-form-linha"
                    action={acaoReabastecer}
                    aria-busy={pendenteReabastecer}
                  >
                    <input type="hidden" name="materialId" value={material.id} />
                    <input type="hidden" name="nomeMaterial" value={material.nome} />
                    <Label className="estoque-campo">
                      {`Quantidade a reabastecer de ${material.nome}`}
                      <Input name="quantidade" type="number" min={1} step={1} required />
                    </Label>
                    <Label className="estoque-campo">
                      {`Validade do lote de ${material.nome}`}
                      <Input name="validade" type="date" required />
                    </Label>
                    <Button
                      type="submit"
                      variant="outline"
                      className="estoque-botao-secundario"
                      disabled={pendenteReabastecer}
                    >
                      {pendenteReabastecer ? "Salvando…" : "Reabastecer"}
                    </Button>
                  </form>
                  <Historico material={material} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  const mensagem = escolhido.detalhe ? `${escolhido.mensagem}: ${escolhido.detalhe}` : escolhido.mensagem;
  return { status: escolhido.status, mensagem, quando: escolhido.quando };
}
