import type { Aparencia, Face } from "./ficha-dados";

const TRACO = "#8A887A";
const FACES: { face: Face; d: string }[] = [
  { face: "V", d: "M0 0 L36 0 L25 11 L11 11 Z" },
  { face: "D", d: "M36 0 L36 36 L25 25 L25 11 Z" },
  { face: "L", d: "M36 36 L0 36 L11 25 L25 25 Z" },
  { face: "M", d: "M0 36 L0 0 L11 11 L11 25 Z" },
];

const CLASSE = {
  livre: "face-livre",
  ausente: "face-ausente",
  carie: "face-carie",
  rest: "face-rest",
  plan: "face-plan",
} as const;

export function DenteFigura({
  aparencia,
  superior,
  selecionado,
}: {
  aparencia: Aparencia;
  superior: boolean;
  selecionado: boolean;
}) {
  const marca = (face: Face) => (aparencia.ausente ? "ausente" : (aparencia.faces[face] ?? "livre"));
  return (
    <svg viewBox="-4 -4 44 44" width="44" height="44" className="dente-figura" aria-hidden="true">
      {selecionado ? (
        <rect x="-4" y="-4" width="44" height="44" rx="6" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="2" />
      ) : null}
      {aparencia.coroa ? (
        <rect x="-3" y="-3" width="42" height="42" rx="4" fill="none" stroke="#111827" strokeWidth="2" />
      ) : null}
      {FACES.map(({ face, d }) => (
        <path
          key={face}
          d={d}
          data-face={face}
          data-marca={marca(face)}
          className={CLASSE[marca(face)]}
          stroke={TRACO}
          strokeWidth="1"
        />
      ))}
      <rect
        x="11"
        y="11"
        width="14"
        height="14"
        data-face="O"
        data-marca={marca("O")}
        className={CLASSE[marca("O")]}
        stroke={TRACO}
        strokeWidth="1"
      />
      {aparencia.ausente ? (
        <g data-ausente="true" stroke="#4B4A42" strokeWidth="2" fill="none">
          <path d="M4 4 L32 32" />
          <path d="M32 4 L4 32" />
        </g>
      ) : null}
      {aparencia.canal ? (
        <circle
          data-canal="true"
          cx="30.5"
          cy={superior ? 5.5 : 30.5}
          r="3.5"
          fill="#8B5CF6"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
      ) : null}
    </svg>
  );
}
