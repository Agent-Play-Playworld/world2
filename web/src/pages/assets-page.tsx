import { useState, type ChangeEvent } from "react";
import { parseCitizenshipCredential } from "../lib/parse-citizenship";
import { purchaseStoreItem, STORE_CATALOG } from "../lib/store-purchase";
import { ECONEXT_HREF } from "../lib/origins";
import type { AcceptedCitizenship } from "../schemas/citizenship";
import type { StoreItem } from "../schemas/store";

type StoreNotice =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "purchased"; itemTitle: string };

const itemActionLabel = (item: StoreItem): string => {
  if (item.kind === "avatar-set") {
    return "Buy avatar set";
  }
  if (item.inkLevel === "low") {
    return "Buy low ink";
  }
  return "Buy high ink";
};

export const AssetsPage = () => {
  const [citizenship, setCitizenship] = useState<AcceptedCitizenship | null>(
    null
  );
  const [notice, setNotice] = useState<StoreNotice>({ kind: "idle" });

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file === undefined) {
      return;
    }
    try {
      const parsedJson: unknown = JSON.parse(await file.text());
      const parsed = parseCitizenshipCredential(parsedJson);
      if (!parsed.ok) {
        setCitizenship(null);
        setNotice({ kind: "error", message: parsed.reason });
        return;
      }
      setCitizenship(parsed.citizenship);
      setNotice({ kind: "idle" });
    } catch {
      setCitizenship(null);
      setNotice({
        kind: "error",
        message: "Upload a credentials.json citizen file.",
      });
    }
  };

  const onBuy = (item: StoreItem) => {
    const result = purchaseStoreItem({
      itemId: item.id,
      citizenship,
    });
    if (!result.ok) {
      setNotice({ kind: "error", message: result.reason });
      return;
    }
    setNotice({ kind: "purchased", itemTitle: item.title });
  };

  return (
    <main className="experience-page">
      <p className="reel-kicker">Citizen shop</p>
      <h1>Buy a World 2 asset</h1>
      <p className="lead">
        First upload your citizenship credential — the same{" "}
        <code>credentials.json</code> issued for Agent Play. Then you can reserve
        an avatar set or ink. Ink is the life in your avatar: low ink, low life;
        high ink, high life. Settlement still runs through the live world and{" "}
        <a href={ECONEXT_HREF}>Econext</a>. This page does not take card numbers
        or chain checkout.
      </p>
      <section className="citizenship-panel">
        <h2>Upload your citizenship credential</h2>
        <label className="field">
          <span>credentials.json</span>
          <input type="file" accept="application/json,.json" onChange={onFile} />
        </label>
        {citizenship !== null ? (
          <p className="form-success">
            Citizen {citizenship.nodeId} on {citizenship.serverUrl}
          </p>
        ) : null}
      </section>
      <ul className="asset-grid">
        {STORE_CATALOG.map((item) => (
          <li key={item.id} className="asset-card">
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <button className="cta" type="button" onClick={() => onBuy(item)}>
              {itemActionLabel(item)}
            </button>
          </li>
        ))}
      </ul>
      {notice.kind === "error" ? (
        <p className="form-error">{notice.message}</p>
      ) : null}
      {notice.kind === "purchased" ? (
        <p className="form-success">
          Reserved {notice.itemTitle} for this citizen. Finish money movement at
          Econext when you take earnings home.
        </p>
      ) : null}
    </main>
  );
};
