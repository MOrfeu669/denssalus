"use client";

import { Plus, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
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
import { DetalheMaterial } from "./detalhe";
import { situacaoQuantidade, venceDentro } from "./situacao";
import { TabelaMateriais } from "./tabela";

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
  validade?: string | null;
  historico: MovimentoTela[];
};

const FILTROS = [
  ["todos", "Todos"],
  ["minimo", "Abaixo do mínimo"],
  ["vencendo", "Vencendo"],
] as const;

export function Estoque({ materiais, hoje }: { materiais: MaterialTela[]; hoje?: string }) {
  const dia = hoje ?? new Date().toISOString().slice(0, 10);
  const roteador = useRouter();
  const nomeRef = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [entradaAberta, setEntradaAberta] = useState(false);
  const [baixaAberta, setBaixaAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number][0]>("todos");
  const [selecionado, setSelecionado] = useState<string | null>(materiais[0]?.id ?? null);
  const [materialEntrada, setMaterialEntrada] = useState(materiais[0]?.id ?? "");
  const [cadastro, acaoCadastrar, pendenteCadastrar] = useActionState(cadastrarMaterial, estadoVazio);
  const [reposicao, acaoReabastecer, pendenteReabastecer] = useActionState(reabastecerMaterial, estadoVazio);
  const aviso = avisoVisivel(cadastro, reposicao);
  const erroNoPainel = aberto && aviso.status === "erro" && aviso.quando === cadastro.quando;

  useEffect(() => {
    if (cadastro.status === "sucesso") setAberto(false);
    if (reposicao.status === "sucesso") setEntradaAberta(false);
  }, [cadastro, reposicao]);

  useEffect(() => {
    if ([cadastro, reposicao].some((item) => item.status === "sucesso")) roteador.refresh();
  }, [cadastro, reposicao, roteador]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return materiais.filter((material) => {
      if (termo && !material.nome.toLocaleLowerCase("pt-BR").includes(termo)) return false;
      if (filtro === "minimo") return material.quantidade < material.quantidadeMinima;
      if (filtro === "vencendo") return venceDentro(material.validade ?? null, dia, 30);
      return true;
    });
  }, [materiais, busca, filtro, dia]);

  const escolhido = materiais.find((material) => material.id === selecionado) ?? null;
  const abaixo = materiais.filter((material) => material.quantidade < material.quantidadeMinima);
  const criticos = abaixo.filter((material) => situacaoQuantidade(material.quantidade, material.quantidadeMinima) === "critico");
  const vencendo = materiais.filter((material) => venceDentro(material.validade ?? null, dia, 30));
  const movimentos = materiais.flatMap((material) => material.historico).filter((item) => item.registradoEm.slice(0, 7) === dia.slice(0, 7));
  const baixas = movimentos.filter((item) => item.tipo === "baixa").length;
  const entradas = movimentos.filter((item) => item.tipo === "entrada").length;

  function aoAbrir(proximo: boolean, detalhes: { cancel: () => void }) {
    if (!proximo && pendenteCadastrar) {
      detalhes.cancel();
      return;
    }
    setAberto(proximo);
  }

  function abrirEntrada(materialId: string) {
    setMaterialEntrada(materialId);
    setEntradaAberta(true);
  }

  return (
    <>
      <header className="estoque-cabeca">
        <div>
          <h1>Estoque</h1>
          <p className="estoque-subtitulo">{`${materiais.length} materiais`}</p>
        </div>
        <div className="estoque-comandos">
          <Button type="button" variant="outline" className="papel-botao papel-botao-secundario h-10" onClick={() => abrirEntrada(selecionado ?? materiais[0]?.id ?? "")} disabled={materiais.length === 0}>
            <RefreshCw aria-hidden="true" /> Registrar movimentação
          </Button>
          <Dialog open={aberto} onOpenChange={aoAbrir}>
            <DialogTrigger render={<Button type="button" className="papel-botao papel-botao-primario h-10 px-4" />}>
              <Plus aria-hidden="true" /> Cadastrar material
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100vh-3rem)] overflow-auto sm:max-w-xl" initialFocus={nomeRef}>
              <DialogHeader>
                <DialogTitle>Cadastrar material</DialogTitle>
                <DialogDescription>Informe o nome, a quantidade, o mínimo e a validade.</DialogDescription>
              </DialogHeader>
              {erroNoPainel ? <Aviso key={aviso.quando} tipo={aviso.status} mensagem={aviso.mensagem} /> : null}
              <form className="flex flex-col gap-4" key={cadastro.status === "sucesso" ? cadastro.quando : 0} action={acaoCadastrar} aria-busy={pendenteCadastrar}>
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
                  <BotaoEnviar className="h-10" rotulo="Cadastrar material" />
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      {erroNoPainel ? null : <Aviso key={aviso.quando} tipo={aviso.status} mensagem={aviso.mensagem} />}
      <div className="estoque-kpis">
        <Kpi rotulo="Materiais" valor={String(materiais.length)} apoio="na clínica" />
        <Kpi rotulo="Abaixo do mínimo" valor={String(abaixo.length)} apoio={`${criticos.length} em nível crítico`} tom="aviso" />
        <Kpi rotulo="Vencem em 30 dias" valor={String(vencendo.length)} apoio={vencendo.slice(0, 2).map((item) => item.nome).join(", ") || "Nenhum lote no prazo"} tom="perigo" />
        <Kpi rotulo="Movimentações no mês" valor={String(movimentos.length)} apoio={`${baixas} baixas · ${entradas} entradas`} tom="roxo" />
      </div>
      <div className={escolhido ? "estoque-corpo" : "estoque-corpo estoque-corpo-cheio"}>
        <section className="estoque-lista-card" aria-labelledby="estoque-titulo-lista">
          <div className="estoque-ferramentas">
            <Label className="estoque-busca">
              <Search aria-hidden="true" />
              <Input value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar material" aria-label="Buscar material" />
            </Label>
            <div className="estoque-segmento" role="group" aria-label="Filtrar materiais">
              {FILTROS.map(([id, rotulo]) => (
                <button key={id} type="button" className="papel-botao" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
                  {rotulo}
                </button>
              ))}
            </div>
          </div>
          <h2 id="estoque-titulo-lista" className="estoque-sr">Materiais da clínica</h2>
          {visiveis.length === 0 ? (
            <p className="estoque-vazio">
              {materiais.length === 0 ? "Nenhum material cadastrado nesta clínica." : "Nenhum material neste filtro."}
            </p>
          ) : (
            <TabelaMateriais materiais={visiveis} hoje={dia} selecionado={selecionado} onSelecionar={setSelecionado} />
          )}
        </section>
        {escolhido ? (
          <DetalheMaterial
            material={escolhido}
            onFechar={() => setSelecionado(null)}
            onEntrada={() => abrirEntrada(escolhido.id)}
            onBaixa={() => setBaixaAberta(true)}
          />
        ) : null}
      </div>
      <Dialog open={entradaAberta} onOpenChange={setEntradaAberta}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar movimentação</DialogTitle>
            <DialogDescription>A entrada cria um lote novo, com a validade informada, só na clínica da sessão.</DialogDescription>
          </DialogHeader>
          {materiais.length === 0 ? <p>Nenhum material cadastrado nesta clínica.</p> : (
            <form className="flex flex-col gap-4" action={acaoReabastecer} aria-busy={pendenteReabastecer}>
              <Label className="flex-col items-start gap-1.5">
                Material
                <select name="materialId" value={materialEntrada} onChange={(evento) => setMaterialEntrada(evento.target.value)} required>
                  {materiais.map((material) => (
                    <option key={material.id} value={material.id}>{material.nome}</option>
                  ))}
                </select>
              </Label>
              <input type="hidden" name="nomeMaterial" value={materiais.find((item) => item.id === materialEntrada)?.nome ?? ""} />
              <Label className="flex-col items-start gap-1.5">
                Quantidade
                <Input name="quantidade" type="number" min={1} step={1} required />
              </Label>
              <Label className="flex-col items-start gap-1.5">
                Validade
                <Input name="validade" type="date" required />
              </Label>
              <DialogFooter>
                <BotaoEnviar className="h-10" rotulo="Registrar entrada" />
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={baixaAberta} onOpenChange={setBaixaAberta}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar baixa</DialogTitle>
            <DialogDescription>
              A baixa avulsa ainda não está definida. O estoque baixa na conclusão do atendimento, quando a evolução é salva, consumindo primeiro o lote que vence antes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBaixaAberta(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Kpi({ rotulo, valor, apoio, tom }: { rotulo: string; valor: string; apoio: string; tom?: "aviso" | "perigo" | "roxo" }) {
  return (
    <article className="estoque-kpi">
      <p className="estoque-kicker">{rotulo}</p>
      <p className="estoque-kpi-valor">{valor}</p>
      <p className={tom ? `estoque-apoio estoque-apoio-${tom}` : "estoque-apoio"}>{apoio}</p>
    </article>
  );
}

function avisoVisivel(...estados: EstadoFormulario[]) {
  const escolhido = estados.reduce((atual, item) => (item.quando > atual.quando ? item : atual));
  const mensagem = escolhido.detalhe ? `${escolhido.mensagem}: ${escolhido.detalhe}` : escolhido.mensagem;
  return { status: escolhido.status, mensagem, quando: escolhido.quando };
}
