import { useState } from "react";
import { CitizenshipOnboarding } from "../components/citizenship-onboarding";
import { GameShell } from "../components/game-shell";
import {
  credentialFromPhrase,
  generateNodePassphrase,
  type DeriveNodeCredential,
} from "../lib/node-credential";
import type { OccupancyFetch } from "../lib/occupancy-client";
import { resolveOccupancyOrigin } from "../lib/occupancy-origin";
import type { EnteredWorld } from "../schemas/entered-world";

type GameShellPageProps = {
  occupancyOrigin?: string | undefined;
  fetchFn?: OccupancyFetch | undefined;
  generatePhrase?: (() => string) | undefined;
  deriveCredential?: DeriveNodeCredential | undefined;
};

export const GameShellPage = (options: GameShellPageProps = {}) => {
  const occupancyOrigin = options.occupancyOrigin ?? resolveOccupancyOrigin();
  const [world, setWorld] = useState<EnteredWorld | null>(null);

  if (world === null) {
    return (
      <main className="game-shell-page">
        <CitizenshipOnboarding
          occupancyOrigin={occupancyOrigin}
          fetchFn={options.fetchFn}
          generatePhrase={options.generatePhrase ?? generateNodePassphrase}
          deriveCredential={options.deriveCredential ?? credentialFromPhrase}
          onEnteredWorld={setWorld}
        />
      </main>
    );
  }

  return (
    <main className="game-shell-page">
      <GameShell
        occupancyOrigin={occupancyOrigin}
        sid={world.sid}
        nodeId={world.nodeId}
        passw={world.passw}
        snapshot={world.snapshot}
        fetchFn={options.fetchFn}
        onCreateNewNode={() => {
          setWorld(null);
        }}
      />
    </main>
  );
};
