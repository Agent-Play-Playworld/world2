import { formatSessionTarget } from "../lib/world-notification";
import type { PlayProximityAction } from "../schemas/world-notification";
import { ActionButton } from "./action-button";

type SessionBoothProps = {
  occupancyOrigin: string;
  nodeId?: string | undefined;
  passw?: string | undefined;
  targetName?: string | undefined;
  onDownload?: (() => void) | undefined;
  onInvite: () => void;
  onCreateNode: () => void;
  onProximityAction?: (action: PlayProximityAction) => void;
};

export const SessionBooth = (options: SessionBoothProps) => {
  const nodeId = options.nodeId ?? "—";
  const mrz = `W2CITIZEN<<${nodeId.replace(/[^A-Z0-9]/gi, "/").toUpperCase()}`;
  const hasTarget = (options.targetName?.trim().length ?? 0) > 0;
  return (
    <div className="play-session-booth">
      <div className="play-passport">
        <p className="play-passport-foil">World 2 citizen folio</p>
        <p className="play-node-title">Node information</p>
        <p className="play-node-row">
          <span>Node id</span>
          <span>{nodeId}</span>
        </p>
        <p className="play-node-row">
          <span>Occupancy</span>
          <span>{options.occupancyOrigin}</span>
        </p>
        <p className="play-passport-mrz">{mrz}</p>
      </div>
      <p className="play-session-target">{formatSessionTarget(options.targetName)}</p>
      <div className="play-visa-row" role="group" aria-label="Proximity visas">
        <button
          type="button"
          className="play-visa"
          disabled={!hasTarget}
          onClick={() => {
            options.onProximityAction?.("assist");
          }}
        >
          Assist Action
        </button>
        <button
          type="button"
          className="play-visa"
          disabled={!hasTarget}
          onClick={() => {
            options.onProximityAction?.("chat");
          }}
        >
          Chat Action
        </button>
        <button
          type="button"
          className="play-visa play-visa-talk"
          disabled={!hasTarget}
          onClick={() => {
            options.onProximityAction?.("talk");
          }}
        >
          Push to Talk
        </button>
      </div>
      <p className="play-session-hint">
        {hasTarget
          ? "Stamp a visa to assist, chat, or talk."
          : "Walk to an agent to stamp a visa and start assist, chat, or talk."}
      </p>
      <div className="play-node-actions">
        {options.passw !== undefined && options.nodeId !== undefined && options.onDownload !== undefined ? (
          <ActionButton label="Download credentials" onClick={options.onDownload} />
        ) : null}
        <ActionButton
          label="Invite friends"
          className="human-onboard-secondary"
          onClick={options.onInvite}
        />
        <ActionButton
          label="Create new node"
          className="play-node-danger"
          onClick={options.onCreateNode}
        />
      </div>
    </div>
  );
};
