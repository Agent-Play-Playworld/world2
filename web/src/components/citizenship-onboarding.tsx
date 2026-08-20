import { useEffect, useRef, useState } from "react";
import { downloadCitizenshipCredentials } from "../lib/download-credentials";
import {
  createHumanNode,
  createOccupancySession,
  loadOccupancyRootKey,
  loadWorldSnapshot,
  validateMainNode,
  type OccupancyFetch,
} from "../lib/occupancy-client";
import {
  credentialFromPhrase,
  generateNodePassphrase,
  hashNodePassword,
  type DeriveNodeCredential,
} from "../lib/node-credential";
import { CitizenshipCredentialSchema } from "../schemas/citizenship";
import { parseCitizenshipCredential } from "../lib/parse-citizenship";
import { EnteredWorldSchema, type EnteredWorld } from "../schemas/entered-world";

const readUploadedText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(String(reader.result ?? ""));
    };
    reader.onerror = () => {
      reject(new Error("Could not read credentials.json."));
    };
    reader.readAsText(file);
  });
};

type OnboardingStep = "welcome" | "papers" | "restore" | "sealed";

type SealedPapers = {
  nodeId: string;
  passw: string;
  requireBackup: boolean;
};

type CitizenshipOnboardingProps = {
  occupancyOrigin: string;
  fetchFn?: OccupancyFetch | undefined;
  generatePhrase?: (() => string) | undefined;
  deriveCredential?: DeriveNodeCredential | undefined;
  onEnteredWorld: (world: EnteredWorld) => void;
};

export const CitizenshipOnboarding = (options: CitizenshipOnboardingProps) => {
  const {
    occupancyOrigin,
    fetchFn,
    generatePhrase = generateNodePassphrase,
    deriveCredential = credentialFromPhrase,
    onEnteredWorld,
  } = options;
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [phrase] = useState(generatePhrase);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sid, setSid] = useState<string | null>(null);
  const [sealed, setSealed] = useState<SealedPapers | null>(null);
  const [backupReady, setBackupReady] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const sessionPromise = useRef<Promise<string> | null>(null);

  useEffect(() => {
    const pending = createOccupancySession({
      origin: occupancyOrigin,
      fetchFn,
    });
    sessionPromise.current = pending;
    void pending
      .then((value) => {
        setSid(value);
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not open an occupancy session."
        );
      });
  }, [fetchFn, occupancyOrigin]);

  const ensureSid = async (): Promise<string> => {
    if (sid !== null) {
      return sid;
    }
    if (sessionPromise.current === null) {
      throw new Error("Session not ready.");
    }
    return sessionPromise.current;
  };

  const enterWorld = async (nodeId: string, sessionId: string): Promise<void> => {
    const snapshot = await loadWorldSnapshot({
      origin: occupancyOrigin,
      fetchFn,
    });
    onEnteredWorld(
      EnteredWorldSchema.parse({
        sid: sessionId,
        nodeId,
        snapshot,
      })
    );
  };

  const onBecomeCitizen = async (): Promise<void> => {
    setError("");
    if (!consent) {
      setError("Consent is required.");
      return;
    }
    setBusy(true);
    try {
      const sessionId = await ensureSid();
      const rootKey = await loadOccupancyRootKey({
        origin: occupancyOrigin,
        fetchFn,
      });
      const credential = await deriveCredential({
        phrase,
        rootKey,
      });
      const created = await createHumanNode({
        origin: occupancyOrigin,
        fetchFn,
        sid: sessionId,
        nodeId: credential.nodeId,
        passwHash: credential.passwHash,
      });
      if (created.nodeId !== credential.nodeId) {
        throw new Error(
          "createHumanNode: server node id does not match local derivation"
        );
      }
      setSid(sessionId);
      setSealed({
        nodeId: created.nodeId,
        passw: credential.phrase,
        requireBackup: true,
      });
      setBackupReady(false);
      setStep("sealed");
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : "createHumanNode failed"
      );
    } finally {
      setBusy(false);
    }
  };

  const onReconnect = async (): Promise<void> => {
    setError("");
    if (restoreFile === null) {
      setError("Choose a credentials.json file first.");
      return;
    }
    setBusy(true);
    try {
      const text = await readUploadedText(restoreFile);
      const json: unknown = JSON.parse(text);
      const parsed = parseCitizenshipCredential(json, { occupancyOrigin });
      if (!parsed.ok) {
        throw new Error(parsed.reason);
      }
      const credential = CitizenshipCredentialSchema.parse(json);
      const passwHash = await hashNodePassword(credential.passw);
      const validated = await validateMainNode({
        origin: occupancyOrigin,
        fetchFn,
        nodeId: parsed.citizenship.nodeId,
        passwHash,
      });
      if (!validated.ok) {
        throw new Error(validated.reason);
      }
      if (validated.nodeKind !== undefined && validated.nodeKind !== "main") {
        throw new Error("Credentials are not for a main node on this server.");
      }
      const sessionId = await ensureSid();
      setSid(sessionId);
      setSealed({
        nodeId: parsed.citizenship.nodeId,
        passw: credential.passw,
        requireBackup: false,
      });
      setBackupReady(true);
      setStep("sealed");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Restore failed");
    } finally {
      setBusy(false);
    }
  };

  const onDownload = (): void => {
    if (sealed === null) {
      return;
    }
    downloadCitizenshipCredentials({
      nodeId: sealed.nodeId,
      passw: sealed.passw,
      serverUrl: occupancyOrigin,
    });
    setBackupReady(true);
  };

  const onEnterWorld = async (): Promise<void> => {
    if (sealed === null) {
      return;
    }
    if (sealed.requireBackup && !backupReady) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const sessionId = await ensureSid();
      await enterWorld(sealed.nodeId, sessionId);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : "Could not load world resources."
      );
      setBusy(false);
    }
  };

  return (
    <div className="human-onboard-overlay" data-citizenship-onboarding="1">
      <div className="human-onboard-stage">
        <aside className="human-onboard-hero">
          <p className="human-onboard-kicker">Citizen induction</p>
          <p className="human-onboard-brand">v0peer</p>
          <p className="human-onboard-hero-copy">
            Claim citizenship before you enter the spatial AI agent metaverse.
            Your Player ID unlocks wallet, agent talk, and Econext.
          </p>
        </aside>
        <section className="human-onboard-panel" aria-label="Citizenship">
          {step === "welcome" ? (
            <>
              <h2 className="human-onboard-title">Become a citizen</h2>
              <p className="human-onboard-lead">
                Citizenship is your ticket in. Issue papers once, keep your
                recovery key, then enter the world to earn, talk, and bank.
              </p>
              <button
                type="button"
                className="human-onboard-link"
                onClick={() => {
                  setError("");
                  setStep("restore");
                }}
              >
                I already have credentials
              </button>
              <div className="human-onboard-actions">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep("papers");
                  }}
                >
                  Start citizenship
                </button>
              </div>
            </>
          ) : null}
          {step === "papers" ? (
            <>
              <h2 className="human-onboard-title">Issue your papers</h2>
              <p className="human-onboard-lead">
                This creates your Player ID — the passport for wallet, agent
                chat, and Econext banking.
              </p>
              <button
                type="button"
                className="human-onboard-link"
                onClick={() => {
                  setError("");
                  setStep("restore");
                }}
              >
                Already a citizen? Restore papers
              </button>
              <label className="human-onboard-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => {
                    setConsent(event.target.checked);
                  }}
                />
                <span>
                  I agree to issue my Player ID for Agent Play World in this
                  session.
                </span>
              </label>
              <p className="human-onboard-phrase-label">Recovery key</p>
              <textarea
                className="human-onboard-phrase"
                readOnly
                value={phrase}
                aria-label="Recovery key"
              />
              <div className="human-onboard-actions">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void onBecomeCitizen();
                  }}
                >
                  Become a citizen
                </button>
              </div>
            </>
          ) : null}
          {step === "restore" ? (
            <>
              <h2 className="human-onboard-title">Restore citizenship</h2>
              <p className="human-onboard-lead">
                Upload credentials.json from a previous backup. We verify your
                recovery key locally, then reconnect this tab.
              </p>
              <label className="human-onboard-file-zone">
                <span>Upload credentials.json</span>
                <input
                  type="file"
                  accept="application/json,.json"
                  aria-label="Upload credentials.json"
                  onChange={(event) => {
                    setError("");
                    setRestoreFile(event.target.files?.[0] ?? null);
                  }}
                />
              </label>
              <div className="human-onboard-actions">
                <button
                  type="button"
                  disabled={busy || restoreFile === null}
                  onClick={() => {
                    void onReconnect();
                  }}
                >
                  Reconnect
                </button>
                <button
                  type="button"
                  className="human-onboard-secondary"
                  onClick={() => {
                    setError("");
                    setRestoreFile(null);
                    setStep("welcome");
                  }}
                >
                  Back
                </button>
              </div>
            </>
          ) : null}
          {step === "sealed" && sealed !== null ? (
            <>
              <h2 className="human-onboard-title">Citizenship sealed</h2>
              <p className="human-onboard-lead">
                {sealed.requireBackup
                  ? "Download your papers before entering. Your recovery key is inside credentials.json."
                  : "Your citizenship is restored for this tab."}
              </p>
              <p className="human-onboard-node-id">{sealed.nodeId}</p>
              <div className="human-onboard-actions">
                <button type="button" onClick={onDownload}>
                  Download credentials.json
                </button>
                <button
                  type="button"
                  className="human-onboard-secondary"
                  disabled={busy || (sealed.requireBackup && !backupReady)}
                  onClick={() => {
                    void onEnterWorld();
                  }}
                >
                  Enter world
                </button>
              </div>
            </>
          ) : null}
          {error.length > 0 ? (
            <p className="human-onboard-error" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
};
