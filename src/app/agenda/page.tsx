import Link from "next/link";
import { listarOpcoesAgendamento, verAgenda } from "../../domain/agendamento/casos";
import type { FiltroAgenda } from "../../domain/agendamento/tipos";
import { dependenciasAgendamento } from "../dependencias";
import { falha } from "../falha";
import { sessaoAtual } from "../sessao";
import { Grade } from "./grade";
import { TempoReal } from "./tempo-real";

export const dynamic = "force-dynamic";

type Query = Record<string, string | string[] | undefined>;

const primeiro = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor);
const par = (n: number) => String(n).padStart(2, "0");

function diaLocal(agora: Date) {
  return `${agora.getFullYear()}-${par(agora.getMonth() + 1)}-${par(agora.getDate())}`;
}

function dataDeCalendario(valor: string | undefined) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor ?? "");
  if (!valor || !partes) return false;
  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

function lerFiltro(query: Query): FiltroAgenda {
  const data = primeiro(query.data);
  return {
    data: dataDeCalendario(data) ? (data as string) : diaLocal(new Date()),
    dentistaId: primeiro(query.dentista) || null,
    cadeiraId: primeiro(query.cadeira) || null,
  };
}

function caminhoAgenda(query: Query) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(query)) {
    const unico = primeiro(valor);
    if (unico !== undefined) params.set(chave, unico);
  }
  const texto = params.toString();
  return texto ? `/agenda?${texto}` : "/agenda";
}

export default async function Page({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const sessao = await sessaoAtual();
  if (!sessao) {
    return (
      <main>
        <h1>Agenda</h1>
        <p>Nenhuma sessão aberta.</p>
      </main>
    );
  }

  try {
    const deps = dependenciasAgendamento();
    const filtro = lerFiltro(query);
    const grade = await verAgenda(deps, sessao, filtro);
    if (!grade.ok) return erroDeCarregamento(grade.mensagem, query);
    const opcoes = await listarOpcoesAgendamento(deps, sessao);
    if (!opcoes.ok) return erroDeCarregamento(opcoes.mensagem, query);

    const { pacientes, dentistas, cadeiras } = opcoes.valor;
    const nomes = {
      pacientes: Object.fromEntries(pacientes.map((p) => [p.id, p.nome])),
      dentistas: Object.fromEntries(dentistas.map((d) => [d.id, d.nome])),
      cadeiras: Object.fromEntries(cadeiras.map((c) => [c.id, c.identificacao])),
    };

    return (
      <main className="largura">
        <h1>Agenda</h1>
        <Grade
          grade={grade.valor}
          data={filtro.data}
          dentistaId={filtro.dentistaId}
          cadeiraId={filtro.cadeiraId}
          nomes={nomes}
          opcoes={{
            dentistas: dentistas.map(({ id, nome }) => ({ id, nome })),
            cadeiras,
          }}
        />
        <TempoReal />
      </main>
    );
  } catch (erro) {
    return erroDeCarregamento(falha(erro).mensagem, query);
  }
}

function erroDeCarregamento(mensagem: string, query: Query) {
  return (
    <main>
      <h1>Agenda</h1>
      <p role="alert" tabIndex={-1}>
        {mensagem}
      </p>
      <p className="nav">
        <Link href={caminhoAgenda(query)}>Tentar de novo</Link>
        {" · "}
        <Link href="/">Voltar</Link>
      </p>
    </main>
  );
}
