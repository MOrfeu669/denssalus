export type DestinoOverlay = "novo" | "bloquear";

export type SlotNovo = {
  inicio: string;
  fim: string;
  dentistaId: string;
  cadeiraId: string;
};

type Pedido = {
  destino: DestinoOverlay;
  origem: HTMLElement;
  slot?: SlotNovo;
};

type Ouvinte = (pedido: Pedido) => void;

const ouvintes = new Set<Ouvinte>();

export function pedirOverlay(pedido: Pedido) {
  for (const ouvinte of ouvintes) ouvinte(pedido);
}

export function ouvirOverlay(ouvinte: Ouvinte) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}
