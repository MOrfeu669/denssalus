"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type MaterialOpcao = { id: string; nome: string };

const SEM_ESCOLHA: string[] = [];

export function VinculoMateriais({
  materiais,
  children,
  listaInicialAberta = false,
  escolhaInicial = SEM_ESCOLHA,
}: {
  materiais: MaterialOpcao[];
  children: ReactNode;
  listaInicialAberta?: boolean;
  escolhaInicial?: string[];
}) {
  const base = useId();
  const painelRef = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(listaInicialAberta);
  const [escolhidos, setEscolhidos] = useState(escolhaInicial);
  const foco = useRef<string | null>(null);
  const painelId = `${base}-painel`;
  const tituloId = `${base}-quantidades`;
  const selecionados = escolhidos.flatMap((id) => {
    const material = materiais.find((item) => item.id === id);
    return material ? [material] : [];
  });

  useEffect(() => {
    if (aberto) painelRef.current?.focus();
  }, [aberto]);

  useEffect(() => {
    const id = foco.current;
    if (!id) return;
    document.getElementById(`${base}-quantidade-${id}`)?.focus();
    foco.current = null;
  }, [escolhidos, base]);

  function alternar(id: string, marcado: boolean) {
    foco.current = marcado ? id : null;
    setEscolhidos((atual) =>
      marcado ? (atual.includes(id) ? atual : [...atual, id]) : atual.filter((item) => item !== id),
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">{children}</div>
        <Button
          type="button"
          variant="outline"
          className="procedimentos-botao procedimentos-botao-secundario h-10 shrink-0 px-3"
          aria-expanded={aberto}
          aria-controls={aberto ? painelId : undefined}
          onClick={() => setAberto((atual) => !atual)}
        >
          Vincular material
        </Button>
      </div>
      {aberto ? (
        <div
          ref={painelRef}
          id={painelId}
          tabIndex={-1}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-paper-md border border-borda-papel bg-papel p-3 shadow-paper-sm"
        >
          {materiais.length === 0 ? (
            <p className="m-0 text-sm text-apagado">Nenhum material cadastrado nesta clínica.</p>
          ) : (
            materiais.map((material) => {
              const campo = `${base}-material-${material.id}`;
              return (
                <div key={material.id} className="flex items-center gap-2">
                  <Checkbox
                    id={campo}
                    checked={escolhidos.includes(material.id)}
                    onCheckedChange={(marcado) => alternar(material.id, marcado)}
                  />
                  <Label htmlFor={campo} className="cursor-pointer font-semibold">
                    {material.nome}
                  </Label>
                </div>
              );
            })
          )}
        </div>
      ) : null}
      {selecionados.length > 0 ? (
        <div className="flex w-full flex-col gap-3">
          <p id={tituloId} className="m-0 text-sm font-semibold text-apagado">
            Quantidade por consulta
          </p>
          <ul aria-labelledby={tituloId} className="m-0 flex list-none flex-col gap-3 p-0">
            {selecionados.map((material) => {
              const campo = `${base}-quantidade-${material.id}`;
              return (
                <li key={material.id}>
                  <input type="hidden" name="materialId" value={material.id} />
                  <Label className="procedimentos-campo max-w-xs flex-col items-stretch gap-2 font-semibold" htmlFor={campo}>
                    {material.nome}
                    <Input
                      id={campo}
                      name={`quantidade-${material.id}`}
                      type="number"
                      min={1}
                      step={1}
                      defaultValue={1}
                      required
                    />
                  </Label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
