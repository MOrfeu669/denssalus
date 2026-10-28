"use client";

import { useState } from "react";
import type { ModeloDocumento } from "../../../domain/documento/tipos";
import { Aviso } from "../../aviso";
import { baixarPdf } from "./acoes-documento";
import { FormularioGerar, FormularioImportar, FormularioPersonalizar } from "./form-documento";
import { instante } from "./formato";

type Papel = "admin" | "dentista" | "recepcionista";

export type DocumentoItem = {
  id: string;
  modeloId: string;
  geradoEm: string;
  conteudoFinal: string;
};

const TAMANHO_TRECHO = 200;

function trecho(conteudo: string): string {
  return conteudo.length > TAMANHO_TRECHO ? `${conteudo.slice(0, TAMANHO_TRECHO)}…` : conteudo;
}

function baixarArquivo(base64: string, nome: string) {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function BotaoBaixar({ documentoId, descricao }: { documentoId: string; descricao: string }) {
  const [erro, setErro] = useState("");
  const [pendente, setPendente] = useState(false);

  async function baixar() {
    setPendente(true);
    setErro("");
    try {
      const resposta = await baixarPdf(documentoId);
      if (resposta.ok) baixarArquivo(resposta.base64, resposta.nome);
      else setErro(resposta.mensagem);
    } catch {
      setErro("Não foi possível concluir a ação");
    } finally {
      setPendente(false);
    }
  }

  return (
    <>
      <Aviso tipo={erro ? "erro" : "vazio"} mensagem={erro} />
      <button type="button" onClick={baixar} disabled={pendente} aria-describedby={descricao}>
        Baixar PDF
      </button>
    </>
  );
}

export function SecaoDocumentos({
  pacienteId,
  papel,
  usuarioId,
  documentos,
  modelos,
  importados,
}: {
  pacienteId: string;
  papel: Papel;
  usuarioId: string;
  documentos: DocumentoItem[];
  modelos: ModeloDocumento[];
  importados: string[];
}) {
  const ehDentista = papel === "dentista";
  const usaveis = modelos.filter(
    (m) =>
      m.tipo === "padrao" ||
      (m.tipo === "personalizado" && (m.criadoPor === usuarioId || importados.includes(m.id))),
  );
  const importaveis = modelos.filter(
    (m) =>
      m.compartilhado &&
      m.criadoPor !== usuarioId &&
      m.tipo === "personalizado" &&
      !importados.includes(m.id),
  );

  return (
    <>
      {ehDentista ? <FormularioGerar pacienteId={pacienteId} modelos={usaveis} /> : null}
      {papel !== "recepcionista" ? <FormularioPersonalizar pacienteId={pacienteId} /> : null}
      {ehDentista && importaveis.length > 0 ? (
        <ul className="lista">
          {importaveis.map((modelo) => (
            <FormularioImportar key={modelo.id} pacienteId={pacienteId} modelo={modelo} />
          ))}
        </ul>
      ) : null}

      {documentos.length === 0 ? <p>Nenhum documento.</p> : null}
      <ul className="lista">
        {documentos.map((documento) => {
          const descricao = `documento-${documento.id}`;
          return (
            <li key={documento.id}>
              <span id={descricao}>
                {instante(documento.geradoEm)} · {trecho(documento.conteudoFinal)}
              </span>
              <BotaoBaixar documentoId={documento.id} descricao={descricao} />
              {ehDentista ? (
                <FormularioGerar
                  pacienteId={pacienteId}
                  modeloId={documento.modeloId}
                  anteriorId={documento.id}
                  descricao={descricao}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
