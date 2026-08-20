import type { AcceptedCitizenship } from "../schemas/citizenship";
import type { StoreItem, StoreOrder } from "../schemas/store";
import { describeInkLife } from "./ink-life";

export const STORE_CATALOG: readonly StoreItem[] = [
  {
    id: "avatar-set",
    kind: "avatar-set",
    title: "Avatar set",
    summary: "A World 2 body you can walk in public with.",
  },
  {
    id: "ink-low",
    kind: "ink",
    title: "Low ink",
    summary: describeInkLife("low"),
    inkLevel: "low",
    life: "low",
  },
  {
    id: "ink-high",
    kind: "ink",
    title: "High ink",
    summary: describeInkLife("high"),
    inkLevel: "high",
    life: "high",
  },
];

export type PurchaseStoreItemOptions = {
  itemId: string;
  citizenship: AcceptedCitizenship | null;
};

export type PurchaseStoreItemResult =
  | { ok: true; order: StoreOrder }
  | { ok: false; reason: string };

export const findStoreItem = (itemId: string): StoreItem | undefined => {
  return STORE_CATALOG.find((item) => item.id === itemId);
};

export const purchaseStoreItem = (
  options: PurchaseStoreItemOptions
): PurchaseStoreItemResult => {
  const { itemId, citizenship } = options;

  if (citizenship === null) {
    return {
      ok: false,
      reason: "Upload a citizenship credential before buying an asset.",
    };
  }

  const item = findStoreItem(itemId);
  if (item === undefined) {
    return {
      ok: false,
      reason: "That asset is not in the World 2 catalog.",
    };
  }

  return {
    ok: true,
    order: {
      itemId: item.id,
      nodeId: citizenship.nodeId,
    },
  };
};
