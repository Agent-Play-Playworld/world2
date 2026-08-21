import { useEffect, type ReactNode } from "react";
import {
  defaultGameStreakPreview,
  defaultInvitePreview,
  defaultWalletPreview,
  powerUpsToNextBundle,
} from "../lib/play-preview";
import type { GameStreakPreview, WalletPreview } from "../schemas/play-preview";
import { ActionButton } from "./action-button";
import { WalletCabinet } from "./wallet-cabinet";

type PlayModalProps = {
  title: string;
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
};

const PlayModal = (options: PlayModalProps) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        options.onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [options.onClose]);
  return (
    <div
      className="play-modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          options.onClose();
        }
      }}
    >
      <div
        className="play-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={options.labelledBy}
      >
        <header className="play-modal-header">
          <h2 id={options.labelledBy} className="play-modal-title">
            {options.title}
          </h2>
          <button
            type="button"
            className="play-modal-close"
            aria-label="Close"
            onClick={options.onClose}
          >
            ×
          </button>
        </header>
        <div className="play-modal-body">{options.children}</div>
      </div>
    </div>
  );
};

export const GameStreakModal = (options: {
  onClose: () => void;
  stats?: GameStreakPreview;
  wallet?: WalletPreview;
}) => {
  const stats = options.stats ?? defaultGameStreakPreview();
  const wallet = options.wallet ?? defaultWalletPreview();
  const bundleGap = powerUpsToNextBundle(wallet.powerUps);
  const pct =
    stats.puCap > 0
      ? Math.min(100, Math.round((stats.puEarnedToday / stats.puCap) * 100))
      : 0;
  return (
    <PlayModal title="Arcade streak" labelledBy="play-games-title" onClose={options.onClose}>
      <div className="play-modal-row">
        <span>Day streak</span>
        <strong>{String(stats.dayStreak)}</strong>
      </div>
      <div className="play-modal-row">
        <span>Best streak</span>
        <strong>{String(stats.bestStreak)}</strong>
      </div>
      <div className="play-modal-row">
        <span>PU today</span>
        <strong>
          {String(stats.puEarnedToday)} / {String(stats.puCap)}
        </strong>
      </div>
      <div className="play-modal-bar">
        <div className="play-modal-bar-fill" style={{ width: `${String(pct)}%` }} />
      </div>
      <div className="play-modal-row">
        <span>Games played</span>
        <strong>{String(stats.gamesPlayedToday)}</strong>
      </div>
      <div className="play-modal-row">
        <span>Featured cabinet</span>
        <strong>{stats.featuredGameId}</strong>
      </div>
      <p className="play-modal-hint">
        {bundleGap === null
          ? "You can redeem every bundle offer."
          : `${String(bundleGap)} PU to next $10 bundle`}
      </p>
    </PlayModal>
  );
};

export const WalletInventoryModal = (options: {
  onClose: () => void;
  wallet?: WalletPreview;
}) => {
  return (
    <PlayModal
      title="Wallet inventory"
      labelledBy="play-wallet-title"
      onClose={options.onClose}
    >
      <WalletCabinet
        onClose={options.onClose}
        {...(options.wallet === undefined ? {} : { wallet: options.wallet })}
      />
    </PlayModal>
  );
};

export const InviteFriendsModal = (options: {
  nodeId: string;
  onClose: () => void;
}) => {
  const invite = defaultInvitePreview(options.nodeId);
  return (
    <PlayModal
      title="Invite friends to complete your world"
      labelledBy="play-invite-title"
      onClose={options.onClose}
    >
      <p className="play-modal-kicker">Party quest</p>
      <p>
        A solo city is only half built. Share your invite so friends can join,
        earn with you, and help co-build Agent Play World.
      </p>
      <div className="play-invite-rewards">
        <div className="play-invite-reward">
          <span>{invite.rewardApu}</span>
          when a friend signs up
        </div>
        <div className="play-invite-reward">
          <span>Co-build</span>
          fill streets together
        </div>
      </div>
      <div className="play-invite-link-box">
        <p>Code {invite.code}</p>
        <p>{invite.link}</p>
      </div>
      <p className="play-modal-hint">Preview invite. Live referral codes land with occupancy.</p>
    </PlayModal>
  );
};

export const CreateNodeModal = (options: {
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  return (
    <PlayModal
      title="Create a new main node?"
      labelledBy="play-create-node-title"
      onClose={options.onCancel}
    >
      <p>
        This will remove the current node credentials from this browser tab and
        start the setup flow again. You cannot undo this: the previous node id
        and passphrase will no longer be available here unless you saved
        credentials.json. Continue only if you understand the consequences.
      </p>
      <div className="play-modal-actions">
        <ActionButton
          label="Cancel"
          className="human-onboard-secondary"
          onClick={options.onCancel}
        />
        <ActionButton label="Yes, replace node" onClick={options.onConfirm} />
      </div>
    </PlayModal>
  );
};
