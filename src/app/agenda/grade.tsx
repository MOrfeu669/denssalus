"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AgendamentoNaGrade, Grade as GradeAgenda } from "../../domain/agendamento/tipos";
import { rotuloStatus } from "./rotulo";

type Nomes = {
  pacientes: Record<string, string>;
  dentistas: Record<string, string>;
  cadeiras: Record<string, string>;
};

type Props = {
  grade: GradeAgenda;
  data: string;
  dentistaId: string | null;
  cadeiraId: string | null;
  nomes: Nomes;
  opcoes: {
    dentistas: { id: string; nome: string }[];
    cadeiras: { id: string; identificacao: string }[];
  };
};

const diaDe = (iso: string) => iso.slice(0, 10);
const horaDe = (iso: string) => Number(iso.slice(11, 13));
const rotuloHora = (h: number) => `${String(h).padStart(2, "0")}:00`;

function rotuloDia(dia: string) {
  const [a, m, d] = dia.split("-").map(Number);
  const semana = new Date(a, m - 1, d).toLocaleDateString("pt-BR", { weekday: "short" });
  return `${semana} ${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
}

function faixaDeHoras(abertura: string, fechamento: string): number[] {
  const primeira = Number(abertura.slice(0, 2));
  const fim = Number(fechamento.slice(0, 2)) * 60 + Number(fechamento.slice(3, 5));
  const horas: number[] = [];
  for (let h = primeira; h * 60 < fim; h++) horas.push(h);
  return horas;
}

function Alerta({ item }: { item: AgendamentoNaGrade }) {
  if (!item.alerta) return null;
  return (
    <span className="alerta" role="img" aria-label={item.textoAlerta ?? "Alerta"}>
      !
    </span>
  );
}

export function Grade({ grade, data, dentistaId, cadeiraId, nomes, opcoes }: Props) {
  const router = useRouter();
  const [visao, setVisao] = useState<"dia" | "semana">("dia");
  const nome = (mapa: Record<string, string>, id: string) => mapa[id] ?? id;

  const colunas = visao === "dia" ? [data] : grade.dias;
  const agendamentos = grade.agendamentos.filter((a) => colunas.includes(diaDe(a.inicio)));
  const bloqueios = grade.bloqueios.filter((b) => colunas.includes(diaDe(b.inicio)));
  const horas = [
    ...new Set([
      ...faixaDeHoras(grade.horarioAbertura, grade.horarioFechamento),
      ...agendamentos.map((a) => horaDe(a.inicio)),
      ...bloqueios.map((b) => horaDe(b.inicio)),
    ]),
  ].sort((x, y) => x - y);

  function filtrar(proximoDentista: string, proximaCadeira: string) {
    const query = new URLSearchParams({ data });
    if (proximoDentista) query.set("dentista", proximoDentista);
    if (proximaCadeira) query.set("cadeira", proximaCadeira);
    router.push(`/agenda?${query.toString()}`, { scroll: false });
  }

  return (
    <section aria-label="Agenda">
      <div className="visao" role="group" aria-label="Visualização">
        <button type="button" aria-pressed={visao === "dia"} onClick={() => setVisao("dia")}>
          Dia
        </button>
        <button type="button" aria-pressed={visao === "semana"} onClick={() => setVisao("semana")}>
          Semana
        </button>
      </div>

      <div className="filtros">
        <label>
          Dentista
          <select value={dentistaId ?? ""} onChange={(e) => filtrar(e.target.value, cadeiraId ?? "")}>
            <option value="">Todos</option>
            {opcoes.dentistas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cadeira
          <select value={cadeiraId ?? ""} onChange={(e) => filtrar(dentistaId ?? "", e.target.value)}>
            <option value="">Todos</option>
            {opcoes.cadeiras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.identificacao}
              </option>
            ))}
          </select>
        </label>
      </div>

      {agendamentos.length === 0 && bloqueios.length === 0 ? (
        <p>Nenhum agendamento neste dia</p>
      ) : (
        <div className="grade-rolagem">
          <table className="grade">
            <thead>
              <tr>
                <th scope="col">Hora</th>
                {colunas.map((dia) => (
                  <th key={dia} scope="col" className="coluna">
                    {rotuloDia(dia)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horas.map((h) => (
                <tr key={h}>
                  <th scope="row">{rotuloHora(h)}</th>
                  {colunas.map((dia) => (
                    <td key={dia} className="coluna">
                      <ul className="grade-itens">
                        {bloqueios
                          .filter((b) => diaDe(b.inicio) === dia && horaDe(b.inicio) === h)
                          .map((b) => (
                            <li key={b.id} className="bloqueio">
                              Bloqueio · {nome(nomes.dentistas, b.dentistaId)}
                              {b.motivo ? ` · ${b.motivo}` : ""}
                            </li>
                          ))}
                        {agendamentos
                          .filter((a) => diaDe(a.inicio) === dia && horaDe(a.inicio) === h)
                          .map((a) => (
                            <li
                              key={a.id}
                              className={`agendamento${a.status === "cancelado" ? " riscado" : ""}${
                                a.alerta ? " com-alerta" : ""
                              }`}
                            >
                              <Alerta item={a} /> {nome(nomes.pacientes, a.pacienteId)} ·{" "}
                              {nome(nomes.dentistas, a.dentistaId)} · {nome(nomes.cadeiras, a.cadeiraId)} ·{" "}
                              {rotuloStatus(a.status)}
                            </li>
                          ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="nav">
        <Link href="/">Voltar</Link>
      </p>
    </section>
  );
}
