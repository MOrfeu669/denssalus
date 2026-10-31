import { IconeDente, IconeOk } from "./icones";

const BENEFICIOS = [
  "Agenda por dentista e por cadeira",
  "Cadastro de pacientes e procedimentos",
  "Acesso por perfil: Admin, Dentista e Recepcionista",
];

export function Marca() {
  return (
    <section className="entrar-marca">
      <span className="entrar-decor entrar-decor-1" aria-hidden="true" />
      <span className="entrar-decor entrar-decor-2" aria-hidden="true" />
      <div className="entrar-logo">
        <span className="entrar-logo-mark">
          <span className="entrar-logo-dente">
            <IconeDente />
          </span>
        </span>
        <span className="entrar-logo-nome">denssalus</span>
      </div>
      <p className="entrar-chamada">Agenda e pacientes da sua clínica, em um só lugar.</p>
      <p className="entrar-apoio">
        Organize a agenda dos dentistas, cadastre pacientes e acompanhe os atendimentos do dia com
        clareza.
      </p>
      <ul className="entrar-beneficios">
        {BENEFICIOS.map((texto) => (
          <li key={texto}>
            <IconeOk />
            <span>{texto}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
