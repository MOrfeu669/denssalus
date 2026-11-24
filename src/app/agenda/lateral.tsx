import { BadgeStatus } from "@/components/ui/badge";
import type { StatusAgendamento } from "../../domain/agendamento/tipos";
import type { AgendamentoNaGrade } from "../../domain/agendamento/tipos";
import { MiniCalendario } from "./calendario";
import { SalaEspera } from "./sala";

const STATUS: StatusAgendamento[] = ["concluido", "iniciado", "em_espera", "agendado", "cancelado"];

export function LateralDia({
  data,
  ocupados,
  espera,
  nomes,
  onEscolher,
}: {
  data: string;
  ocupados: ReadonlySet<string>;
  espera: AgendamentoNaGrade[];
  nomes: { pacientes: Record<string, string>; dentistas: Record<string, string> };
  onEscolher: (iso: string) => void;
}) {
  return (
    <aside className="flex w-full flex-col gap-4 xl:w-[304px] xl:shrink-0">
      <MiniCalendario data={data} ocupados={ocupados} onEscolher={onEscolher} />
      <SalaEspera itens={espera} nomes={nomes} />
      <section className="rounded-paper-md border border-borda-papel bg-card px-5 py-4 shadow-paper-sm" aria-label="Status">
        <h2 className="m-0 font-heading text-base leading-6 font-semibold text-tinta">Status</h2>
        <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-3 p-0">
          {STATUS.map((status) => (
            <li key={status}>
              <BadgeStatus status={status} />
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
