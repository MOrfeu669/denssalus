"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { MENSAGEM_TAMANHO, TETO_BYTES } from "../../../domain/imagem/tipos";
import { createClient } from "../../../lib/supabase/client";
import { Aviso } from "../../aviso";
import { estadoVazio, type EstadoFormulario } from "../../formulario";
import { confirmarEnvio, prepararEnvio } from "./acoes-imagem";
import { dataAgendamento } from "./formato";
import type { AgendamentoOpcao } from "./tipos-odontograma";

const BUCKET = "prontuario-imagens";
const FALHA_GERAL = "Não foi possível concluir a ação";
const FALHA_ENVIO = "Não foi possível enviar o arquivo";
const SEM_ARQUIVO = "Selecione um arquivo";

function campo(dados: FormData, nome: string): string {
  return String(dados.get(nome) ?? "").trim();
}

export function FormularioImagem({
  pacienteId,
  agendamentos,
}: {
  pacienteId: string;
  agendamentos: AgendamentoOpcao[];
}) {
  const roteador = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const [aviso, setAviso] = useState<EstadoFormulario>(estadoVazio);
  const [pendente, setPendente] = useState(false);

  function avisar(status: EstadoFormulario["status"], mensagem: string) {
    setAviso({ status, mensagem, detalhe: "", quando: Date.now() });
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const arquivo = dados.get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size === 0) return avisar("erro", SEM_ARQUIVO);
    if (arquivo.size > TETO_BYTES) return avisar("erro", MENSAGEM_TAMANHO);

    setPendente(true);
    try {
      const preparo = await prepararEnvio(pacienteId);
      if (!preparo.ok) return avisar("erro", preparo.mensagem);
      // O arquivo vai do navegador direto ao Storage; a Server Action não o recebe.
      const { error } = await createClient()
        .storage.from(BUCKET)
        .uploadToSignedUrl(preparo.caminho, preparo.token, arquivo);
      if (error) return avisar("erro", FALHA_ENVIO);

      const dente = campo(dados, "dente");
      const resposta = await confirmarEnvio({
        pacienteId,
        id: preparo.id,
        caminho: preparo.caminho,
        tamanhoBytes: arquivo.size,
        tipoCaso: campo(dados, "tipoCaso"),
        descricao: campo(dados, "descricao"),
        dente: dente === "" ? null : Number(dente),
        agendamentoId: campo(dados, "agendamentoId") || null,
      });
      avisar(resposta.status === "vazio" ? "erro" : resposta.status, resposta.mensagem);
      if (resposta.status === "sucesso") {
        formulario.current?.reset();
        roteador.refresh();
      }
    } catch {
      avisar("erro", FALHA_GERAL);
    } finally {
      setPendente(false);
    }
  }

  return (
    <>
      <Aviso key={aviso.quando} tipo={aviso.status} mensagem={aviso.mensagem} />
      <form ref={formulario} onSubmit={enviar} aria-busy={pendente}>
        <label>
          Arquivo
          <input type="file" name="arquivo" required />
        </label>
        <label>
          Tipo de caso
          <input type="text" name="tipoCaso" required />
        </label>
        <label>
          Descrição
          <input type="text" name="descricao" required />
        </label>
        <label>
          Dente (opcional)
          <input type="number" name="dente" inputMode="numeric" />
        </label>
        <label>
          Consulta (opcional)
          <select name="agendamentoId" defaultValue="">
            <option value="">Nenhuma</option>
            {agendamentos.map((agendamento) => (
              <option key={agendamento.id} value={agendamento.id}>
                {`${dataAgendamento(agendamento.inicio)} · ${agendamento.status} · ${agendamento.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pendente}>
          Anexar imagem
        </button>
      </form>
    </>
  );
}
