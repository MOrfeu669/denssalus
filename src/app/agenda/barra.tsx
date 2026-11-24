"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { rotuloDiaLongo, rotuloIntervalo } from "./apresentacao";
import type { VisaoGrade } from "./posicao";

type Opcao = { id: string; rotulo: string };

export function BarraAgenda({
  data,
  visao,
  dentistaId,
  cadeiraId,
  dentistas,
  cadeiras,
  dias,
  onVisao,
  onFiltrar,
}: {
  data: string;
  visao: VisaoGrade;
  dentistaId: string | null;
  cadeiraId: string | null;
  dentistas: Opcao[];
  cadeiras: Opcao[];
  dias: string[];
  onVisao: (visao: VisaoGrade) => void;
  onFiltrar: (dentista: string, cadeira: string, data?: string) => void;
}) {
  const rotulo =
    visao === "semana" && dias.length > 0
      ? rotuloIntervalo(dias[0], dias[dias.length - 1])
      : rotuloDiaLongo(data);
  const passo = visao === "semana" ? "semana" : "dia";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        className="agenda-icone"
        aria-label={passo === "semana" ? "Semana anterior" : "Dia anterior"}
        onClick={() => onFiltrar(dentistaId ?? "", cadeiraId ?? "", deslocar(data, visao, -1))}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <Button
        type="button"
        className="agenda-secundario"
        onClick={() => onFiltrar(dentistaId ?? "", cadeiraId ?? "", hoje())}
      >
        Hoje
      </Button>
      <Button
        type="button"
        className="agenda-icone"
        aria-label={passo === "semana" ? "Próxima semana" : "Próximo dia"}
        onClick={() => onFiltrar(dentistaId ?? "", cadeiraId ?? "", deslocar(data, visao, 1))}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
      <p className="m-0 font-heading text-[18px] leading-7 font-semibold text-tinta">{rotulo}</p>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Visualização"
          className="inline-flex h-9 items-center rounded-controle bg-[#E6E6DA] p-1"
        >
          <Button type="button" className="agenda-segmento" aria-pressed={visao === "dia"} onClick={() => onVisao("dia")}>
            Dia
          </Button>
          <Button
            type="button"
            className="agenda-segmento"
            aria-pressed={visao === "semana"}
            onClick={() => onVisao("semana")}
          >
            Semana
          </Button>
        </div>
        <NativeSelect
          className="w-[220px]"
          aria-label="Dentistas"
          value={dentistaId ?? ""}
          onChange={(evento) => onFiltrar(evento.target.value, cadeiraId ?? "")}
        >
          <NativeSelectOption value="">{`Todos os dentistas (${dentistas.length})`}</NativeSelectOption>
          {dentistas.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.rotulo}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          className="w-[200px]"
          aria-label="Cadeiras"
          value={cadeiraId ?? ""}
          onChange={(evento) => onFiltrar(dentistaId ?? "", evento.target.value)}
        >
          <NativeSelectOption value="">Todas as cadeiras</NativeSelectOption>
          {cadeiras.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.rotulo}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}

function hoje() {
  const agora = new Date();
  const par = (n: number) => String(n).padStart(2, "0");
  return `${agora.getFullYear()}-${par(agora.getMonth() + 1)}-${par(agora.getDate())}`;
}

function deslocar(data: string, visao: VisaoGrade, sentido: 1 | -1) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!partes) return data;
  const dias = (visao === "semana" ? 7 : 1) * sentido;
  const alvo = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]) + dias);
  const par = (n: number) => String(n).padStart(2, "0");
  return `${alvo.getFullYear()}-${par(alvo.getMonth() + 1)}-${par(alvo.getDate())}`;
}
