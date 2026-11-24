"use client";

import { Download, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { estadoVazio } from "../formulario";
import { cadastrar, editar } from "./actions";
import { exportarCsv, lerParaEditar } from "./actions-lista";
import { Alerta } from "./alerta";
import { Campos } from "./campos";
import type { ConsultaLista } from "./consulta";
import { ListaPacientes } from "./lista";
import type { PacienteLinha } from "./linha";
import { TEXTO_IMPORTACAO, textoResumo } from "./texto";
import type { PaginaLista } from "./tipos-lista";

export type { PacienteLinha } from "./linha";

const BOTAO = "h-10 rounded-paper-sm px-4";

export function Pacientes({ pagina, consulta }: { pagina: PaginaLista; consulta: ConsultaLista }) {
  const roteador = useRouter();
  const avisoRef = useRef<HTMLParagraphElement>(null);
  const [cadastro, acaoCadastrar, pendenteCadastrar] = useActionState(cadastrar, estadoVazio);
  const [edicao, acaoEditar, pendenteEditar] = useActionState(editar, estadoVazio);
  const [aberto, setAberto] = useState(false);
  const [importacaoAberta, setImportacaoAberta] = useState(false);
  const [editando, setEditando] = useState<PacienteLinha | null>(null);
  const [avisoLista, setAvisoLista] = useState("");
  const [exportando, setExportando] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const filtro = `${consulta.termo}|${consulta.chip}`;
  const [filtroVisto, setFiltroVisto] = useState(filtro);
  if (filtro !== filtroVisto) {
    setFiltroVisto(filtro);
    setSelecionados([]);
  }
  const aviso = cadastro.quando >= edicao.quando ? cadastro : edicao;
  const erroNoPainel = aberto && aviso === cadastro && cadastro.status === "erro";

  useEffect(() => {
    if (edicao.status === "sucesso") setEditando(null);
    if (cadastro.status === "sucesso") setAberto(false);
  }, [edicao, cadastro]);

  useEffect(() => {
    if (cadastro.status === "sucesso" || edicao.status === "sucesso") roteador.refresh();
  }, [cadastro, edicao, roteador]);

  useEffect(() => {
    if (avisoLista !== "") avisoRef.current?.focus();
  }, [avisoLista]);

  function aoMudar(proximo: boolean, detalhes: { cancel: () => void }) {
    if (!proximo && pendenteCadastrar) {
      detalhes.cancel();
      return;
    }
    setAberto(proximo);
  }

  async function abrirEdicao(id: string) {
    setAvisoLista("");
    const resposta = await lerParaEditar(id);
    if (!resposta.ok) {
      setAvisoLista(resposta.mensagem);
      return;
    }
    setEditando(resposta.paciente);
  }

  async function aoExportar() {
    setExportando(true);
    setAvisoLista("");
    const resposta = await exportarCsv({ termo: consulta.termo, chip: consulta.chip, ids: selecionados });
    setExportando(false);
    if (!resposta.ok) {
      setAvisoLista(resposta.mensagem);
      return;
    }
    const url = URL.createObjectURL(new Blob([resposta.csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = resposta.nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setAvisoLista("CSV gerado");
  }

  return (
    <div data-tela="pacientes">
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 font-heading text-[32px] leading-10 font-bold text-tinta">Pacientes</h1>
          <p className="m-0 mt-1.5 text-base leading-6 text-paper-ink-2">{textoResumo(pagina.totalClinica)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" className={BOTAO} disabled={exportando} onClick={() => void aoExportar()}>
            <Download aria-hidden="true" />
            {exportando ? "Gerando…" : "Exportar CSV"}
          </Button>
          <Button type="button" variant="outline" className={BOTAO} onClick={() => setImportacaoAberta(true)}>
            <Upload aria-hidden="true" />
            Importar planilha
          </Button>
          <Dialog open={aberto} onOpenChange={aoMudar} disablePointerDismissal={pendenteCadastrar}>
            <DialogTrigger render={<Button type="button" className={BOTAO} />}>
              <Plus aria-hidden="true" />
              Cadastrar paciente
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="max-h-[calc(100vh-3rem)] overflow-y-auto sm:max-w-3xl">
              <DialogHeader className="flex-row items-start justify-between pr-0">
                <div className="flex flex-col gap-2">
                  <DialogTitle id="pacientes-novo-titulo">Novo paciente</DialogTitle>
                  <DialogDescription>
                    Nome completo e ao menos um canal de comunicação são obrigatórios.
                  </DialogDescription>
                </div>
                <DialogClose className={buttonVariants({ variant: "outline", className: "h-8 shrink-0" })}>
                  Fechar
                </DialogClose>
              </DialogHeader>
              {erroNoPainel ? <Alerta estado={cadastro} /> : null}
              <form
                className="pacientes-form"
                key={cadastro.status === "sucesso" ? cadastro.quando : 0}
                action={acaoCadastrar}
                aria-busy={pendenteCadastrar}
              >
                <Campos />
                <BotaoEnviar rotulo="Cadastrar paciente" className="h-10 self-start rounded-paper-sm px-4 text-sm font-medium" />
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {erroNoPainel ? null : <Alerta estado={aviso} />}
      {avisoLista !== "" ? (
        <p
          ref={avisoRef}
          tabIndex={-1}
          role={avisoLista === "CSV gerado" ? "status" : "alert"}
          className={`pacientes-aviso ${avisoLista === "CSV gerado" ? "pacientes-aviso-sucesso" : "pacientes-aviso-erro"}`}
        >
          {avisoLista}
        </p>
      ) : null}
      <ListaPacientes
        pagina={pagina}
        consulta={consulta}
        selecionados={selecionados}
        onSelecionar={setSelecionados}
        onEditar={(id) => void abrirEdicao(id)}
      />
      <Dialog open={editando !== null} onOpenChange={(proximo) => { if (!proximo && !pendenteEditar) setEditando(null); }}>
        <DialogContent showCloseButton={false} className="max-h-[calc(100vh-3rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader className="flex-row items-start justify-between pr-0">
            <div className="flex flex-col gap-2">
              <DialogTitle>Editar paciente</DialogTitle>
              <DialogDescription>
                Nome completo e ao menos um canal de comunicação são obrigatórios.
              </DialogDescription>
            </div>
            <DialogClose className={buttonVariants({ variant: "outline", className: "h-8 shrink-0" })}>
              Fechar
            </DialogClose>
          </DialogHeader>
          {edicao.status === "erro" ? <Alerta estado={edicao} /> : null}
          {editando ? (
            <form key={editando.id} className="pacientes-form" action={acaoEditar} aria-busy={pendenteEditar}>
              <input type="hidden" name="id" value={editando.id} />
              <Campos paciente={editando} />
              <BotaoEnviar rotulo="Salvar paciente" className="h-10 self-start rounded-paper-sm px-4 text-sm font-medium" />
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={importacaoAberta} onOpenChange={setImportacaoAberta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar planilha</DialogTitle>
            <DialogDescription>{TEXTO_IMPORTACAO}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
