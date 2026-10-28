"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "../../../domain/auth/casos";
import { MENSAGEM_PAPEL } from "../../../domain/auth/tipos";
import {
  conferirRetorno,
  configurarAtraso,
  descontinuarProtese,
  instalarProtese,
  registrarEnvio,
  registrarPedido,
} from "../../../domain/protese/casos";
import { dependencias, dependenciasProtese } from "../../dependencias";
import { falha } from "../../falha";
import { estado, type EstadoFormulario } from "../../formulario";

const SEM_SESSAO = "Nenhuma sessão aberta";

function texto(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim();
}

function ouNulo(formData: FormData, campo: string): string | null {
  return texto(formData, campo) || null;
}

// Vazio vira NaN de propósito: o domínio recusa, a tela não esconde um 0.
function numero(formData: FormData, campo: string): number {
  const valor = texto(formData, campo);
  return valor === "" ? Number.NaN : Number(valor);
}

function dentes(formData: FormData): number[] {
  return texto(formData, "dentes")
    .split(/[\s,]+/)
    .filter((parte) => parte !== "")
    .map(Number);
}

type Sessao = NonNullable<Awaited<ReturnType<typeof obterSessao>>>;
type Resultado = { ok: true } | { ok: false; mensagem: string };

async function executar(
  formData: FormData,
  sucesso: string,
  chamar: (sessao: Sessao) => Promise<Resultado>,
): Promise<EstadoFormulario> {
  try {
    const sessao = await obterSessao(dependencias());
    if (!sessao) return estado("erro", SEM_SESSAO);
    const resultado = await chamar(sessao);
    if (!resultado.ok) return estado("erro", resultado.mensagem);
    revalidatePath(`/prontuarios/${texto(formData, "pacienteId")}`);
    return estado("sucesso", sucesso);
  } catch (causa) {
    return estado("erro", falha(causa).mensagem);
  }
}

export async function registrarPedidoProtese(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  return executar(formData, "Pedido de prótese registrado", (sessao) =>
    registrarPedido(
      dependenciasProtese(),
      sessao,
      {
        pacienteId: texto(formData, "pacienteId"),
        dentes: dentes(formData),
        tipo: texto(formData, "tipo"),
        responsavelId: texto(formData, "responsavelId"),
        laboratorio: texto(formData, "laboratorio"),
        procedimentoAvaliacaoId: ouNulo(formData, "procedimentoAvaliacaoId"),
        procedimentoCirurgiaId: ouNulo(formData, "procedimentoCirurgiaId"),
      },
      new Date(),
    ),
  );
}

export async function registrarEnvioProtese(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  return executar(formData, "Envio registrado", (sessao) =>
    registrarEnvio(
      dependenciasProtese(),
      sessao,
      { proteseId: texto(formData, "proteseId"), prazoRetorno: texto(formData, "prazoRetorno") },
      new Date(),
    ),
  );
}

export async function conferirRetornoProtese(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  return executar(formData, "Retorno conferido", (sessao) =>
    conferirRetorno(
      dependenciasProtese(),
      sessao,
      {
        proteseId: texto(formData, "proteseId"),
        ajusteNecessario: ouNulo(formData, "ajusteNecessario"),
      },
      new Date(),
    ),
  );
}

export async function instalarProteseAcao(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  return executar(formData, "Prótese instalada", (sessao) =>
    instalarProtese(
      dependenciasProtese(),
      sessao,
      {
        proteseId: texto(formData, "proteseId"),
        valorComissao: numero(formData, "valorComissao"),
        agendamentoInstalacaoId: ouNulo(formData, "agendamentoInstalacaoId"),
      },
      new Date(),
    ),
  );
}

export async function descontinuarPedidoProtese(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  return executar(formData, "Pedido descontinuado", (sessao) =>
    descontinuarProtese(dependenciasProtese(), sessao, texto(formData, "proteseId"), new Date()),
  );
}

export async function salvarLimiteAtraso(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  return executar(formData, "Limite de atraso salvo", async (sessao) => {
    if (sessao.usuario.papel !== "admin") return { ok: false, mensagem: MENSAGEM_PAPEL };
    return configurarAtraso(dependenciasProtese(), sessao, numero(formData, "diasLimiteAtraso"));
  });
}
