import { describe, expect, it } from "vitest";
import { MONEY_FLOW_STEPS } from "./money-flow";
import { MONEY_FLOW_HOPS, MONEY_FLOW_MAP_NODES, hopPath } from "./money-flow-map";

describe("money flow map", () => {
  it("places every money step on the map in flow order", () => {
    expect(MONEY_FLOW_MAP_NODES.map((node) => node.id)).toEqual(
      MONEY_FLOW_STEPS.map((step) => step.id)
    );
  });

  it("draws a hop from each point to the next", () => {
    expect(MONEY_FLOW_HOPS).toHaveLength(MONEY_FLOW_MAP_NODES.length - 1);
    expect(MONEY_FLOW_HOPS[0]?.fromId).toBe("walk-in");
    expect(MONEY_FLOW_HOPS[MONEY_FLOW_HOPS.length - 1]?.toId).toBe("bank");
  });

  it("curves a hop between two map points", () => {
    expect(hopPath({ x: 10, y: 10 }, { x: 40, y: 30 })).toMatch(/^M 10 10 C /);
  });
});
