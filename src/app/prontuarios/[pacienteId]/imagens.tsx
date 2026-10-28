"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MENSAGEM_PAPEL } from "../../../domain/auth/tipos";
import { Aviso } from "../../aviso";
import { estadoVazio, type EstadoFormulario } from "../../formulario";
import { excluirImagem, restaurarImagem } from "./acoes-imagem";
import { FormularioImagem } from "./form-imagem";
import type { ImagemAtiva, ImagemDoDente, ImagemPendente } from "./tipos-imagem";
import type { AgendamentoOpcao } from "./tipos-odontograma";

const FALHA_GERAL = "Não foi possível concluir a ação";

function Miniatura({ url, descricao }: { url: string; descricao: string }) {
  if (!url) return <span>Imagem indisponível</span>;
  // URL assinada de outro domínio: next/image exigiria configuração de host.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={descricao} style={{ maxWidth: "16rem", height: "auto" }} />;
}

function Legenda({ dente, tipoCaso }: { dente: number | null; tipoCaso: string }) {
  return (
    <span>
      {dente === null ? "" : `Dente ${dente} · `}
      {tipoCaso}
    </span>
  );
}

export function ImagensDoDente({ imagens, dente }: { imagens: ImagemDoDente[]; dente: number }) {
  const doDente = imagens.filter((imagem) => imagem.dente === dente);
  return (
    <section aria-label={`Imagens do dente ${dente}`}>
      <h4>Imagens do dente {dente}</h4>
      {doDente.length === 0 ? <p>Nenhuma imagem neste dente.</p> : null}
      <ul className="lista">
        {doDente.map((imagem) => (
          <li key={imagem.id}>
            <Miniatura url={imagem.url} descricao={imagem.descricao} />
            <span>{imagem.descricao}</span>
            <Legenda dente={imagem.dente} tipoCaso={imagem.tipoCaso} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SecaoImagens({
  pacienteId,
  ativas,
  pendentes,
  agendamentos,
  podeEscrever,
}: {
  pacienteId: string;
  ativas: ImagemAtiva[];
  pendentes: ImagemPendente[];
  agendamentos: AgendamentoOpcao[];
  podeEscrever: boolean;
}) {
  const roteador = useRouter();
  const [aviso, setAviso] = useState<EstadoFormulario>(estadoVazio);
  const [pendenteId, setPendenteId] = useState<string | null>(null);

  async function executar(
    acao: (pacienteId: string, imagemId: string) => Promise<EstadoFormulario>,
    imagemId: string,
  ) {
    setPendenteId(imagemId);
    try {
      const resposta = await acao(pacienteId, imagemId);
      setAviso({ ...resposta, quando: Date.now() });
      if (resposta.status === "sucesso") roteador.refresh();
    } catch {
      setAviso({ status: "erro", mensagem: FALHA_GERAL, detalhe: "", quando: Date.now() });
    } finally {
      setPendenteId(null);
    }
  }

  return (
    <>
      {podeEscrever ? <FormularioImagem pacienteId={pacienteId} agendamentos={agendamentos} /> : null}
      <Aviso key={aviso.quando} tipo={aviso.status} mensagem={aviso.mensagem} />

      {ativas.length === 0 ? <p>Nenhuma imagem registrada.</p> : null}
      <ul className="lista">
        {ativas.map((imagem) => (
          <li key={imagem.id}>
            <Miniatura url={imagem.url} descricao={imagem.descricao} />
            <span>{imagem.descricao}</span>
            <Legenda dente={imagem.dente} tipoCaso={imagem.tipoCaso} />
            {podeEscrever ? (
              <button
                type="button"
                disabled={pendenteId !== null}
                onClick={() => executar(excluirImagem, imagem.id)}
              >
                Excluir imagem
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {pendentes.length > 0 ? (
        <>
          <h3>Exclusão pendente</h3>
          <ul className="lista">
            {pendentes.map((imagem) => (
              <li key={imagem.id}>
                <span>{imagem.descricao}</span>
                <Legenda dente={imagem.dente} tipoCaso={imagem.tipoCaso} />
                {podeEscrever ? (
                  <button
                    type="button"
                    disabled={pendenteId !== null}
                    onClick={() => executar(restaurarImagem, imagem.id)}
                  >
                    Restaurar imagem
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {podeEscrever ? null : <p>{MENSAGEM_PAPEL}</p>}
    </>
  );
}
