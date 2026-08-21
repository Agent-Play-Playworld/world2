import { ActionButton } from "./action-button";

type SessionBoothProps = {
  occupancyOrigin: string;
  nodeId?: string | undefined;
  passw?: string | undefined;
  onDownload?: (() => void) | undefined;
  onInvite: () => void;
  onCreateNode: () => void;
};

export const SessionBooth = (options: SessionBoothProps) => {
  const nodeId = options.nodeId ?? "—";
  const mrz = `W2CITIZEN<<${nodeId.replace(/[^A-Z0-9]/gi, "/").toUpperCase()}`;
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
      <p className="play-session-target">Target: (none)</p>
      <div className="play-visa-row" role="group" aria-label="Proximity visas">
        <button type="button" className="play-visa" disabled>
          Assist Action
        </button>
        <button type="button" className="play-visa" disabled>
          Chat Action
        </button>
        <button type="button" className="play-visa play-visa-talk" disabled>
          Push to Talk
        </button>
      </div>
      <p className="play-session-hint">Walk to an agent to stamp a visa and start assist, chat, or talk.</p>
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
