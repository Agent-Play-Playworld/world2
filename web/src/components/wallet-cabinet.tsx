import { useState } from "react";
import {
  defaultWalletPreview,
  formatApuCount,
  formatApwBalance,
  isImageWalletAsset,
} from "../lib/play-preview";
import type { WalletAsset, WalletPreview } from "../schemas/play-preview";

type WalletCabinetProps = {
  onClose: () => void;
  wallet?: WalletPreview;
};

export const WalletCabinet = (options: WalletCabinetProps) => {
  const wallet = options.wallet ?? defaultWalletPreview();
  const [selectedId, setSelectedId] = useState<string | null>(
    wallet.assets[0]?.id ?? null
  );
  const selected =
    wallet.assets.find((asset) => asset.id === selectedId) ?? wallet.assets[0];

  return (
    <div className="play-wallet-cabinet">
      <div className="play-wallet-cabinet-ledger">
        <p className="play-wallet-balance">{formatApwBalance(wallet.balanceUsd)}</p>
        <p className="play-wallet-power">
          <span className="play-wallet-diamond" aria-hidden="true" />
          {formatApuCount(wallet.powerUps)} APU
        </p>
      </div>
      <div className="play-wallet-slots" role="list">
        {wallet.assets.map((asset) => (
          <div key={asset.id} role="listitem">
            <button
              type="button"
              className={
                selected?.id === asset.id
                  ? "play-wallet-slot is-selected"
                  : "play-wallet-slot"
              }
              onClick={() => {
                setSelectedId(asset.id);
              }}
            >
              <span className="play-wallet-slot-kind">{asset.kind}</span>
              <span>{asset.name}</span>
            </button>
          </div>
        ))}
      </div>
      {selected === undefined ? (
        <p className="play-modal-empty">No items yet.</p>
      ) : (
        <WalletAssetStage asset={selected} />
      )}
      <button type="button" className="play-modal-close-inline" onClick={options.onClose}>
        Close vault
      </button>
    </div>
  );
};

const WalletAssetStage = (options: { asset: WalletAsset }) => {
  const { asset } = options;
  if (isImageWalletAsset(asset)) {
    return (
      <figure className="play-wallet-stage">
        <img src={asset.previewUrl} alt={asset.name} />
        <figcaption>{asset.caption}</figcaption>
      </figure>
    );
  }
  return (
    <figure className="play-wallet-stage play-wallet-stage-pdf">
      <iframe title={asset.name} src={asset.previewUrl} />
      <figcaption>{asset.caption}</figcaption>
    </figure>
  );
};
