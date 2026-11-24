"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MENSAGEM_HORARIO_INVALIDO } from "../../../domain/agendamento/tipos";
import { mover } from "../../agendamentos/actions";
import { camposDoHorario, horarioRemarcado } from "./remarcar-horario";

type MoverHorario = (
  id: string,
  inicio: string,
  fim: string,
  dentistaId: string,
) => Promise<{ ok: true } | { ok: false; mensagem: string }>;

export function RemarcarConsulta({
  agendamentoId,
  dentistaId,
  inicio,
  fim,
  moverHorario = mover,
}: {
  agendamentoId: string;
  dentistaId: string;
  inicio: string;
  fim: string;
  moverHorario?: MoverHorario;
}) {
  const roteador = useRouter();
  const avisoRef = useRef<HTMLParagraphElement>(null);
  const inicial = camposDoHorario(inicio);
  const [aberto, setAberto] = useState(false);
  const [data, setData] = useState(inicial?.data ?? "");
  const [hora, setHora] = useState(inicial?.hora ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const campos = camposDoHorario(inicio);
    if (!campos) return;
    setData(campos.data);
    setHora(campos.hora);
  }, [aberto, inicio]);

  useEffect(() => {
    if (erro || sucesso) avisoRef.current?.focus();
  }, [erro, sucesso]);

  function aoAbrir(proximo: boolean) {
    setAberto(proximo);
    if (proximo) return;
    setErro(null);
    setSucesso(null);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const intervalo = horarioRemarcado(inicio, fim, data, hora);
    if (!intervalo) {
      setSucesso(null);
      setErro(MENSAGEM_HORARIO_INVALIDO);
      return;
    }
    setPendente(true);
    const resultado = await moverHorario(agendamentoId, intervalo.inicio, intervalo.fim, dentistaId);
    setPendente(false);
    if (!resultado.ok) {
      setSucesso(null);
      setErro(resultado.mensagem);
      return;
    }
    setErro(null);
    setSucesso("Horário movido. A ficha e a agenda passam a mostrar o novo horário.");
    roteador.refresh();
  }

  const aviso = erro ?? sucesso;

  return (
    <div className="min-w-0 flex-1">
      <Dialog open={aberto} onOpenChange={aoAbrir} disablePointerDismissal={pendente}>
        <DialogTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="h-8 w-full rounded-paper-sm px-2 text-[13px]"
            />
          }
        >
          Remarcar
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remarcar consulta</DialogTitle>
            <DialogDescription>
              Este horário muda de lugar. Não nasce outro agendamento.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={(evento) => void enviar(evento)} aria-busy={pendente}>
            <Label className="flex-col items-stretch gap-1.5">
              Data
              <Input name="data" type="date" required value={data} onChange={(evento) => setData(evento.target.value)} />
            </Label>
            <Label className="flex-col items-stretch gap-1.5">
              Hora
              <Input name="hora" type="time" required value={hora} onChange={(evento) => setHora(evento.target.value)} />
            </Label>
            {aviso ? (
              <p
                ref={avisoRef}
                tabIndex={-1}
                role={erro ? "alert" : "status"}
                className={
                  erro
                    ? "m-0 rounded-paper-sm border border-perigo bg-perigo-fundo px-3 py-2 text-sm font-semibold text-perigo-tinta outline-none"
                    : "m-0 rounded-paper-sm border border-ok bg-ok-fundo px-3 py-2 text-sm font-semibold text-ok-tinta outline-none"
                }
              >
                {aviso}
              </p>
            ) : null}
            <Button type="submit" className="h-10" disabled={pendente}>
              {pendente ? "Movendo…" : "Mover horário"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
