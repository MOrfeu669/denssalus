"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Canal } from "../../../domain/paciente/tipos";
import { textoDoLembrete } from "./ficha-dados";

export function BotaoLembrete({
  inicio,
  canal,
  agoraIso,
}: {
  inicio: string;
  canal: Canal | null;
  agoraIso: string;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  return (
    <div className="min-w-0 flex-1">
      <Button
        type="button"
        variant="outline"
        className="h-8 w-full gap-1.5 rounded-paper-sm px-2 text-[13px]"
        aria-expanded={texto !== null}
        onClick={() => setTexto(textoDoLembrete(inicio, canal, new Date(agoraIso)))}
      >
        <MessageCircle aria-hidden="true" className="text-ok" />
        Enviar lembrete
      </Button>
      {texto ? (
        <p className="mt-2 mb-0 text-xs leading-4 text-paper-ink-2" role="status">
          {texto}
        </p>
      ) : null}
    </div>
  );
}
