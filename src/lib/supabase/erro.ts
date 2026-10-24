export class ErroAplicacao extends Error {
  constructor(mensagem: string, causa?: unknown) {
    super(mensagem, causa === undefined ? undefined : { cause: causa });
    this.name = "ErroAplicacao";
  }
}

export function mensagemCausa(causa: unknown): string | undefined {
  if (causa instanceof Error) return causa.message;
  if (causa && typeof causa === "object" && "message" in causa && typeof causa.message === "string") {
    return causa.message;
  }
  return undefined;
}
