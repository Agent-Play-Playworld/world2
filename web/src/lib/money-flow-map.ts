import {
  MoneyFlowHopSchema,
  MoneyFlowMapNodeSchema,
  type MoneyFlowHop,
  type MoneyFlowMapNode,
} from "../schemas/money-flow-map";
import { MONEY_FLOW_STEPS } from "./money-flow";

const NODE_POINTS: Record<string, { x: number; y: number }> = {
  "walk-in": { x: 50, y: 86 },
  arcade: { x: 78, y: 38 },
  shops: { x: 18, y: 42 },
  talk: { x: 48, y: 52 },
  invite: { x: 32, y: 18 },
  bundles: { x: 68, y: 22 },
  owners: { x: 24, y: 68 },
  bank: { x: 82, y: 72 },
};

export const hopPath = (
  from: { x: number; y: number },
  to: { x: number; y: number }
): string => {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const c1x = from.x + dx * 0.35;
  const c1y = from.y + dy * 0.12 - 8;
  const c2x = midX + dy * 0.08;
  const c2y = midY - dx * 0.06;
  return `M ${String(from.x)} ${String(from.y)} C ${String(c1x)} ${String(c1y)}, ${String(c2x)} ${String(c2y)}, ${String(to.x)} ${String(to.y)}`;
};

export const MONEY_FLOW_MAP_NODES: readonly MoneyFlowMapNode[] =
  MONEY_FLOW_STEPS.map((step) => {
    const point = NODE_POINTS[step.id];
    if (point === undefined) {
      throw new Error(`Money flow map is missing ${step.id}`);
    }
    return MoneyFlowMapNodeSchema.parse({
      id: step.id,
      label: step.title,
      x: point.x,
      y: point.y,
    });
  });

export const MONEY_FLOW_HOPS: readonly MoneyFlowHop[] = MONEY_FLOW_MAP_NODES.slice(
  0,
  -1
).map((node, index) => {
  const next = MONEY_FLOW_MAP_NODES[index + 1];
  if (next === undefined) {
    throw new Error("Money flow hop is missing a destination");
  }
  return MoneyFlowHopSchema.parse({
    fromId: node.id,
    toId: next.id,
    d: hopPath(node, next),
  });
});
