import type { ReactNode } from "react";
import { BlankWorldCanvas } from "./blank-world-canvas";
import { PlayChrome } from "./play-chrome";
import type { OccupancyFetch } from "../lib/occupancy-client";
import type { CreateOccupancyEventSource } from "../lib/occupancy-events";

type GameShellProps = {
  children?: ReactNode;
  hud?: ReactNode | null;
  occupancyOrigin?: string | undefined;
  sid?: string | undefined;
  nodeId?: string | undefined;
  passw?: string | undefined;
  snapshot?: unknown;
  fetchFn?: OccupancyFetch | undefined;
  createEventSource?: CreateOccupancyEventSource | undefined;
  onCreateNewNode?: (() => void) | undefined;
};

export const GameShell = (options: GameShellProps) => {
  const {
    children,
    hud,
    occupancyOrigin,
    sid,
    nodeId,
    passw,
    snapshot,
    fetchFn,
    createEventSource,
    onCreateNewNode,
  } = options;
  const resolvedHud =
    hud === undefined ? (
      <PlayChrome
        occupancyOrigin={occupancyOrigin}
        sid={sid}
        nodeId={nodeId}
        passw={passw}
        snapshot={snapshot}
        fetchFn={fetchFn}
        createEventSource={createEventSource}
        onCreateNewNode={onCreateNewNode}
      />
    ) : (
      hud
    );

  return (
    <section className="game-shell" aria-label="Game shell">
      <div className="game-shell-world">{children ?? <BlankWorldCanvas />}</div>
      {resolvedHud !== null ? (
        <div className="game-shell-hud">{resolvedHud}</div>
      ) : null}
    </section>
  );
};
