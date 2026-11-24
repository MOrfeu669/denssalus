"use client";

import { useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";

const LIMIAR_ROLAGEM = 4;

export function scrollDoArraste(inicio: number, origemX: number, x: number) {
  return inicio - (x - origemX);
}

export function useRolagemHorizontal() {
  const origem = useRef<{ x: number; scroll: number; id: number; el: HTMLDivElement } | null>(null);
  const moveu = useRef(false);
  const [arrastando, setArrastando] = useState(false);

  function pointerDown(evento: ReactPointerEvent<HTMLDivElement>) {
    if (evento.button !== 0) return;
    const alvo = evento.target as HTMLElement;
    if (alvo.closest("a, [data-alca]")) return;
    origem.current = {
      x: evento.clientX,
      scroll: evento.currentTarget.scrollLeft,
      id: evento.pointerId,
      el: evento.currentTarget,
    };
    moveu.current = false;
  }

  function pointerMove(evento: ReactPointerEvent<HTMLDivElement>) {
    const gesto = origem.current;
    if (!gesto) return;
    const dx = evento.clientX - gesto.x;
    if (Math.abs(dx) < LIMIAR_ROLAGEM) return;
    if (!moveu.current) {
      moveu.current = true;
      gesto.el.setPointerCapture(gesto.id);
      setArrastando(true);
    }
    gesto.el.scrollLeft = scrollDoArraste(gesto.scroll, gesto.x, evento.clientX);
  }

  function pointerUp() {
    origem.current = null;
    setArrastando(false);
  }

  function clique(evento: ReactMouseEvent<HTMLDivElement>) {
    if (!moveu.current) return;
    evento.preventDefault();
    evento.stopPropagation();
    moveu.current = false;
  }

  return { arrastando, pointerDown, pointerMove, pointerUp, clique };
}
