export type EstadoFormulario = {
  status: "vazio" | "erro" | "sucesso";
  mensagem: string;
  detalhe: string;
  quando: number;
};

export const estadoVazio: EstadoFormulario = {
  status: "vazio",
  mensagem: "",
  detalhe: "",
  quando: 0,
};

export function estado(
  status: EstadoFormulario["status"],
  mensagem: string,
  detalhe = "",
): EstadoFormulario {
  return { status, mensagem, detalhe, quando: Date.now() };
}
