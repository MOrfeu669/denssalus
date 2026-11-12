"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { AgendamentoNaGrade } from "../../domain/agendamento/tipos";
import { mover } from "../agendamentos/actions";
import type { VisaoGrade } from "./posicao";
import { encaixarMinuto, intervaloEntreMinutos } from "./slot";

const LIMIAR = 4;
const MINIMO = 15;

type Gesto = {
  id: string;
  modo: "mover" | "alongar";
  origemX: number;
  origemY: number;
  origemTop: number;
  origemAltura: number;
  origemColuna: number;
  dentistaId: string;
  moveu: boolean;
};

export type PreviewArraste = {
  id: string;
  coluna: number;
  topo: number;
  altura: number;
};

type Faixa = { topoMinutos: number; alturaMinutos: number };

export function useArrasteGrade(entrada: {
  visao: VisaoGrade;
  data: string;
  chaves: string[];
  primeiraHora: number;
  alturaGrade: number;
  aoConcluir: () => void;
}) {
  const gradeRef = useRef<HTMLDivElement>(null);
  const gesto = useRef<Gesto | null>(null);
  const cliqueBloqueado = useRef(false);
  const contexto = useRef(entrada);
  contexto.current = entrada;
  const [preview, setPreview] = useState<PreviewArraste | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ativo, setAtivo] = useState(false);
  const erroRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (erro) erroRef.current?.focus();
  }, [erro]);

  useEffect(() => {
    if (!ativo) return;

    function colunaNoPonto(x: number, fallback: number) {
      const nos = gradeRef.current?.querySelectorAll<HTMLElement>("[data-coluna]") ?? [];
      for (const no of nos) {
        const rect = no.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right) return Number(no.dataset.coluna);
      }
      return fallback;
    }

    function calcular(g: Gesto, x: number, y: number): PreviewArraste {
      const atual = contexto.current;
      const dy = y - g.origemY;
      if (g.modo === "alongar") {
        const altura = Math.min(
          Math.max(MINIMO, encaixarMinuto(g.origemAltura + dy)),
          Math.max(MINIMO, atual.alturaGrade - g.origemTop),
        );
        return { id: g.id, coluna: g.origemColuna, topo: g.origemTop, altura };
      }
      const topoMax = Math.max(0, atual.alturaGrade - g.origemAltura);
      const topo = Math.min(Math.max(0, encaixarMinuto(g.origemTop + dy)), topoMax);
      return {
        id: g.id,
        coluna: colunaNoPonto(x, g.origemColuna),
        topo,
        altura: g.origemAltura,
      };
    }

    function aoMover(evento: PointerEvent) {
      const g = gesto.current;
      if (!g) return;
      if (Math.abs(evento.clientX - g.origemX) > LIMIAR || Math.abs(evento.clientY - g.origemY) > LIMIAR) {
        g.moveu = true;
      }
      setPreview(calcular(g, evento.clientX, evento.clientY));
    }

    function aoSoltar(evento: PointerEvent) {
      const g = gesto.current;
      gesto.current = null;
      setAtivo(false);
      setPreview(null);
      if (!g?.moveu) return;
      cliqueBloqueado.current = true;
      const atual = contexto.current;
      const lugar = calcular(g, evento.clientX, evento.clientY);
      const dia = atual.visao === "semana" ? atual.chaves[lugar.coluna] : atual.data;
      const dentistaId = atual.visao === "dia" ? atual.chaves[lugar.coluna] : g.dentistaId;
      const inicioMin = atual.primeiraHora * 60 + lugar.topo;
      const intervalo = dia ? intervaloEntreMinutos(dia, inicioMin, inicioMin + lugar.altura) : null;
      if (!intervalo || !dentistaId) return;
      void mover(g.id, intervalo.inicio, intervalo.fim, dentistaId).then((resultado) => {
        if (!resultado.ok) setErro(resultado.mensagem);
        else {
          setErro(null);
          atual.aoConcluir();
        }
      });
    }

    window.addEventListener("pointermove", aoMover);
    window.addEventListener("pointerup", aoSoltar);
    return () => {
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerup", aoSoltar);
    };
  }, [ativo]);

  function comecar(
    evento: ReactPointerEvent<HTMLElement>,
    modo: "mover" | "alongar",
    item: AgendamentoNaGrade,
    faixa: Faixa,
    coluna: number,
  ) {
    if (item.status !== "agendado" || ativo) return;
    const altura = Math.max(faixa.alturaMinutos, MINIMO);
    gesto.current = {
      id: item.id,
      modo,
      origemX: evento.clientX,
      origemY: evento.clientY,
      origemTop: faixa.topoMinutos,
      origemAltura: altura,
      origemColuna: coluna,
      dentistaId: item.dentistaId,
      moveu: false,
    };
    setPreview({ id: item.id, coluna, topo: faixa.topoMinutos, altura });
    setAtivo(true);
  }

  function consumirClique(): boolean {
    const bloqueado = cliqueBloqueado.current;
    cliqueBloqueado.current = false;
    return bloqueado;
  }

  return { gradeRef, preview, erro, erroRef, comecar, consumirClique, ativo };
}
