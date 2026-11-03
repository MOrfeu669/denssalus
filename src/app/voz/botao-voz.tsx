"use client";

import {
  ConversationProvider,
  useConversationControls,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { executarFerramenta, obterUrlAssinada } from "./actions";
import "./tela.css";

// Mantidos em sincronia com `ferramentas.ts` (não importado aqui: é código de servidor).
const LEITURA = ["buscar_paciente", "listar_dentistas", "listar_cadeiras", "listar_procedimentos", "ver_clinica", "ver_agenda", "consultar_estoque", "historico_material"];
const ESCRITA = ["criar_agendamento", "marcar_chegada", "iniciar_atendimento", "cancelar_agendamento", "criar_bloqueio", "cadastrar_paciente", "cadastrar_material", "reabastecer_material", "vincular_material_procedimento"];

const par = (n: number) => String(n).padStart(2, "0");

type Props = { nomeUsuario: string; papel: string };

/** O SDK atual exige `ConversationProvider` acima de qualquer hook de conversa. */
export function BotaoVoz(props: Props) {
  return (
    <ConversationProvider>
      <PainelVoz {...props} />
    </ConversationProvider>
  );
}

function PainelVoz({ nomeUsuario, papel }: Props) {
  const [pendente, setPendente] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const { startSession, endSession } = useConversationControls();
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();

  /** Toda escrita passa por confirmação na TELA: não depende de o modelo lembrar de perguntar. */
  const confirmar = useCallback(
    (resumo: string) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setPendente(resumo);
      }),
    [],
  );
  const responder = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setPendente(null);
  }, []);

  const clientTools = useMemo(() => {
    const chamar = async (nome: string, parametros: Record<string, unknown>) =>
      JSON.stringify(await executarFerramenta(nome, parametros));
    const tools: Record<string, (p: Record<string, unknown>) => Promise<string>> = {};
    for (const nome of LEITURA) tools[nome] = (p) => chamar(nome, p);
    for (const nome of ESCRITA) {
      tools[nome] = async (p) => {
        const { resumo, ...parametros } = p;
        const confirmado = await confirmar(String(resumo ?? "Confirmar esta operação?"));
        if (!confirmado) return JSON.stringify({ ok: false, mensagem: "O usuário cancelou na tela. Nada foi feito." });
        return chamar(nome, parametros);
      };
    }
    return tools;
  }, [confirmar]);

  const iniciar = async () => {
    setAviso("");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return setAviso("Permita o uso do microfone para falar com o assistente.");
    }
    const url = await obterUrlAssinada();
    if (!url.ok) return setAviso(url.mensagem);

    const agora = new Date();
    const hojeIso = `${agora.getFullYear()}-${par(agora.getMonth() + 1)}-${par(agora.getDate())}`;
    startSession({
      signedUrl: url.url,
      clientTools,
      dynamicVariables: {
        nome_usuario: nomeUsuario,
        papel,
        data_hoje: new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short" }).format(agora),
        data_iso: hojeIso,
      },
      onError: () => setAviso("A conversa por voz foi interrompida."),
      onDisconnect: () => responder(false),
    });
  };

  const ativo = status === "connected";
  const conectando = status === "connecting";
  const rotulo = ativo
    ? isSpeaking
      ? "Falando… Encerrar"
      : "Ouvindo… Encerrar"
    : conectando
      ? "Conectando…"
      : "Assistente de voz";

  return (
    <>
      <button
        type="button"
        className={`voz-botao${ativo ? " voz-botao-ativo" : ""}`}
        aria-label={ativo ? "Encerrar conversa por voz" : "Iniciar conversa por voz"}
        disabled={conectando}
        onClick={ativo ? () => endSession() : iniciar}
      >
        {rotulo}
      </button>
      <p className="voz-aviso" role="status" aria-live="polite">
        {aviso}
      </p>

      {pendente ? (
        <div className="voz-fundo">
          <div className="voz-dialogo" role="alertdialog" aria-modal="true" aria-labelledby="voz-titulo" aria-describedby="voz-resumo">
            <h2 id="voz-titulo">Confirmar?</h2>
            <p id="voz-resumo">{pendente}</p>
            <div className="voz-acoes">
              <button type="button" onClick={() => responder(false)}>
                Cancelar
              </button>
              <button type="button" autoFocus onClick={() => responder(true)}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}