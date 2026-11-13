"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  CENTRO,
  dataNoMes,
  deslocarDia,
  distanciaVisual,
  faixa,
  nomeMes,
  papelDaDistancia,
  passosDoArraste,
  rotuloDia,
} from "./faixa-data";

const LIMIAR = 6;

export function FaixaDatas({ data, onEscolher }: { data: string; onEscolher: (data: string) => void }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Trilho
        rotulo="Meses"
        itens={faixa(data, dataNoMes, CENTRO + 4)}
        centro={4 + CENTRO}
        passoPx={104}
        onEscolher={(passos) => onEscolher(dataNoMes(data, passos))}
        render={(item, selecionado) => (
          <span className={`px-2 text-sm leading-5 font-semibold capitalize ${selecionado ? "text-white" : "text-tinta"}`}>
            {nomeMes(item)}
          </span>
        )}
      />
      <Trilho
        rotulo="Datas"
        itens={faixa(data, deslocarDia, CENTRO + 4)}
        centro={4 + CENTRO}
        passoPx={56}
        onEscolher={(passos) => onEscolher(deslocarDia(data, passos))}
        render={(item, selecionado) => {
          const { semana, numero } = rotuloDia(item);
          return (
            <span className="flex flex-col items-center leading-none">
              <span className={`text-[10px] font-semibold uppercase ${selecionado ? "text-white/80" : "text-apagado"}`}>
                {semana}
              </span>
              <span className={`text-base font-bold ${selecionado ? "text-white" : "text-tinta"}`}>{numero}</span>
            </span>
          );
        }}
      />
    </div>
  );
}

function Trilho({
  rotulo,
  itens,
  centro,
  passoPx,
  onEscolher,
  render,
}: {
  rotulo: string;
  itens: string[];
  centro: number;
  passoPx: number;
  onEscolher: (passos: number) => void;
  render: (item: string, selecionado: boolean) => ReactNode;
}) {
  const [px, setPx] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const origem = useRef<{ x: number; px: number; id: number; el: HTMLDivElement } | null>(null);
  const moveu = useRef(false);
  const largura = 3 * (passoPx - 8) + 4 * (passoPx - 8) * 0.42 + 6 * 8;

  function soltar(passos: number) {
    setPx(0);
    setArrastando(false);
    origem.current = null;
    if (passos !== 0) onEscolher(passos);
  }

  return (
    <div
      role="group"
      aria-label={rotulo}
      className="relative mx-auto overflow-hidden"
      style={{ width: largura }}
      onPointerDown={(evento) => {
        if (evento.button !== 0) return;
        origem.current = { x: evento.clientX, px, id: evento.pointerId, el: evento.currentTarget };
        moveu.current = false;
      }}
      onPointerMove={(evento) => {
        if (!origem.current) return;
        const dx = evento.clientX - origem.current.x;
        if (Math.abs(dx) <= LIMIAR) return;
        if (!moveu.current) {
          moveu.current = true;
          origem.current.el.setPointerCapture(origem.current.id);
          setArrastando(true);
        }
        setPx(origem.current.px + dx);
      }}
      onPointerUp={(evento) => {
        if (!origem.current) return;
        const dx = evento.clientX - origem.current.x;
        const atual = origem.current.px + dx;
        soltar(Math.abs(dx) > LIMIAR ? passosDoArraste(atual, passoPx) : 0);
      }}
      onPointerCancel={() => soltar(0)}
    >
      <div
        className={`flex items-center gap-2 ${arrastando ? "cursor-grabbing" : "cursor-grab"} ${arrastando ? "" : "transition-transform duration-200"}`}
        style={{ transform: `translateX(${px + (largura / 2 - (centro * passoPx + (passoPx - 8) / 2))}px)` }}
      >
        {itens.map((item, indice) => {
          const distancia = distanciaVisual(indice, centro, px, passoPx);
          const papel = papelDaDistancia(distancia);
          const selecionado = Math.abs(distancia) < 0.5;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={selecionado}
              aria-label={rotulo === "Meses" ? nomeMes(item) : `${rotuloDia(item).semana} ${rotuloDia(item).numero}`}
              className={`grid shrink-0 place-items-center rounded-xl border ${
                selecionado
                  ? "border-acao! bg-acao! text-white!"
                  : "border-linha! bg-white! text-tinta!"
              } ${papel === "amostra" ? "opacity-100" : papel === "lado" ? "opacity-40" : "opacity-0"}`}
              style={{ width: passoPx - 8, height: rotulo === "Meses" ? 36 : 52 }}
              onClick={() => {
                if (moveu.current) return;
                onEscolher(indice - centro);
              }}
            >
              {render(item, selecionado)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
