import { IconeDente, IconeOk } from "./icones";

const BENEFICIOS = [
  "Agenda por dentista e por cadeira",
  "Cadastro de pacientes e procedimentos",
  "Acesso por perfil: Admin, Dentista e Recepcionista",
];

export function Marca() {
  return (
    <section className="relative flex min-h-screen flex-col items-start justify-center gap-8 overflow-hidden bg-marca px-18 py-16 text-white max-[960px]:min-h-0 max-[960px]:px-6 max-[960px]:py-12">
      <span
        className="pointer-events-none absolute -top-30 -right-40 size-[460px] rounded-full bg-acao opacity-[0.35]"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -bottom-39 -left-40 size-[420px] rounded-full bg-destaque opacity-[0.18]"
        aria-hidden="true"
      />
      <div className="relative z-[1] flex max-w-[576px] items-center gap-2.5">
        <span className="relative size-11 shrink-0 rounded-[12.32px] bg-white">
          <span className="absolute top-[12.79px] left-[13.55px] leading-none">
            <IconeDente />
          </span>
        </span>
        <span className="text-[22px] leading-[30px] font-bold">denssalus</span>
      </div>
      <p className="relative z-[1] m-0 max-w-[576px] text-[32px] leading-10 font-bold tracking-[-0.01em]">
        Agenda e pacientes da sua clínica, em um só lugar.
      </p>
      <p className="relative z-[1] m-0 max-w-[576px] text-base leading-6 font-normal text-nevoa">
        Organize a agenda dos dentistas, cadastre pacientes e acompanhe os atendimentos do dia com
        clareza.
      </p>
      <ul className="relative z-[1] m-0 flex max-w-[576px] list-none flex-col gap-3.5 p-0">
        {BENEFICIOS.map((texto) => (
          <li key={texto} className="flex items-center gap-2.5 text-sm leading-5 font-normal">
            <IconeOk />
            <span>{texto}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
