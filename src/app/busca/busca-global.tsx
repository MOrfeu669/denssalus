"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent as Tecla } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buscarPacientesGlobais, type ItemBusca } from "./actions";

type Resposta = { ok: true; valor: ItemBusca[] } | { ok: false; mensagem: string };

export function BuscaGlobal({ buscar = buscarPacientesGlobais }: { buscar?: (termo: string) => Promise<Resposta> }) {
  const roteador = useRouter();
  const listaId = useId();
  const campo = useRef<HTMLInputElement>(null);
  const pedido = useRef(0);
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultados, setResultados] = useState<ItemBusca[]>([]);
  const [ativo, setAtivo] = useState(0);

  useEffect(() => {
    function atalho(evento: KeyboardEvent) {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        campo.current?.focus();
      }
    }
    document.addEventListener("keydown", atalho);
    return () => document.removeEventListener("keydown", atalho);
  }, []);

  useEffect(() => {
    const consulta = termo.trim();
    if (consulta.length < 2) {
      setResultados([]);
      setErro("");
      setAberto(false);
      setBuscando(false);
      return;
    }
    const id = ++pedido.current;
    const timer = setTimeout(() => {
      setBuscando(true);
      void buscar(consulta).then((resposta) => {
        if (id !== pedido.current) return;
        setBuscando(false);
        if (!resposta.ok) {
          setErro(resposta.mensagem);
          setResultados([]);
          setAberto(true);
          return;
        }
        setErro("");
        setResultados(resposta.valor);
        setAtivo(0);
        setAberto(true);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [termo, buscar]);

  function ir(id: string) {
    setAberto(false);
    roteador.push(`/prontuarios/${id}`);
  }

  function escolher() {
    if (resultados.length === 1) {
      ir(resultados[0]!.id);
      return;
    }
    const item = resultados[ativo];
    if (item) ir(item.id);
  }

  function aoTecla(evento: Tecla<HTMLInputElement>) {
    if (evento.key === "Escape") {
      setAberto(false);
      return;
    }
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setAberto(true);
      setAtivo((indice) => Math.min(indice + 1, Math.max(resultados.length - 1, 0)));
      return;
    }
    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setAtivo((indice) => Math.max(indice - 1, 0));
      return;
    }
    if (evento.key === "Enter") {
      evento.preventDefault();
      escolher();
    }
  }

  const listaVisivel = aberto && termo.trim().length >= 2;

  return (
    <div className="relative ml-auto w-full max-w-[320px]">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-paper-ink-3" aria-hidden="true" />
      <Input
        ref={campo}
        type="text"
        role="combobox"
        aria-expanded={listaVisivel}
        aria-controls={listaId}
        aria-autocomplete="list"
        aria-label="Buscar paciente, CPF ou telefone"
        placeholder="Buscar paciente, CPF ou telefone"
        value={termo}
        className="h-10 rounded-controle border-borda-papel pr-14 pl-10"
        onChange={(evento) => setTermo(evento.target.value)}
        onKeyDown={aoTecla}
        onFocus={() => {
          if (resultados.length > 0 || erro) setAberto(true);
        }}
      />
      {termo === "" ? (
        <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-borda-papel bg-paper-subtle px-1.5 font-mono text-[12px] leading-4 text-paper-ink-3 sm:inline">
          ⌘K
        </kbd>
      ) : null}
      {listaVisivel ? (
        <ul
          id={listaId}
          role="listbox"
          aria-label="Resultados da busca"
          className="absolute top-[calc(100%+8px)] right-0 left-0 z-30 m-0 max-h-80 list-none overflow-y-auto rounded-paper-md border border-borda-papel bg-popover p-1 text-popover-foreground shadow-paper-overlay"
        >
          {buscando ? <li className="px-3 py-2 text-sm text-apagado">Buscando…</li> : null}
          {erro ? (
            <li className="px-3 py-2 text-sm font-semibold text-perigo-tinta" role="alert">
              {erro}
            </li>
          ) : null}
          {!buscando && !erro && resultados.length === 0 ? (
            <li className="px-3 py-2 text-sm text-apagado">Nenhum paciente encontrado</li>
          ) : null}
          {resultados.map((item, indice) => (
            <li key={item.id} role="option" aria-selected={indice === ativo}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-controle border-0 bg-transparent px-3 py-2 text-left text-sm text-tinta",
                  indice === ativo && "bg-paper-subtle",
                )}
                onMouseEnter={() => setAtivo(indice)}
                onClick={() => ir(item.id)}
              >
                <span className="truncate">{item.nome}</span>
                <span className="shrink-0 font-mono text-xs text-apagado tabular-nums">
                  {item.cpfMascarado ?? "Sem CPF"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
