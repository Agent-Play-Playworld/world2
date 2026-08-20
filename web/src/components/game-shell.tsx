import type { ReactNode } from "react";
import { BlankWorldCanvas } from "./blank-world-canvas";
import { PlayChrome } from "./play-chrome";

type GameShellProps = {
  children?: ReactNode;
  hud?: ReactNode | null;
  occupancyOrigin?: string | undefined;
  sid?: string | undefined;
  nodeId?: string | undefined;
  snapshot?: unknown;
};

export const GameShell = (options: GameShellProps) => {
  const { children, hud, occupancyOrigin, sid, nodeId, snapshot } = options;
  const resolvedHud =
    hud === undefined ? (
      <PlayChrome
        occupancyOrigin={occupancyOrigin}
        sid={sid}
        nodeId={nodeId}
        snapshot={snapshot}
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
