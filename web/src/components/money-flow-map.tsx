import { MONEY_FLOW_HOPS, MONEY_FLOW_MAP_NODES } from "../lib/money-flow-map";

export const MoneyFlowMap = () => {
  return (
    <svg
      className="money-flow-map"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Money flow map"
    >
      <title>Money flow map</title>
      <rect className="money-flow-map-paper" x="0" y="0" width="100" height="100" />
      <g className="money-flow-map-ground" aria-hidden="true">
        <rect className="money-flow-map-park" x="8" y="8" width="28" height="18" rx="4" />
        <rect className="money-flow-map-block" x="62" y="8" width="30" height="16" rx="3" />
        <rect className="money-flow-map-block" x="8" y="54" width="22" height="20" rx="3" />
        <rect className="money-flow-map-block" x="70" y="56" width="22" height="22" rx="3" />
        <path className="money-flow-map-street" d="M 4 32 H 96" />
        <path className="money-flow-map-street" d="M 4 58 H 96" />
        <path className="money-flow-map-street" d="M 36 6 V 94" />
        <path className="money-flow-map-street" d="M 64 6 V 94" />
      </g>
      {MONEY_FLOW_HOPS.map((hop) => (
        <g key={`${hop.fromId}-${hop.toId}`}>
          <path className="money-flow-map-rail" d={hop.d} />
          <path className="money-flow-map-pulse" d={hop.d} />
        </g>
      ))}
      {MONEY_FLOW_MAP_NODES.map((node) => (
        <g key={node.id} className="money-flow-map-node">
          <circle cx={node.x} cy={node.y} r="3.1" />
          <text x={node.x} y={node.y - 4}>
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
};
