import { useEffect, useRef, useState } from "react";
import { downloadCitizenshipCredentials } from "../lib/download-credentials";
import {
  INDUCTION_BRAND,
  INDUCTION_GATES,
  INDUCTION_NEXT,
  INDUCTION_NEXT_CHECKING,
  INDUCTION_NEXT_RESTORED,
  INDUCTION_TRACK,
  inductionStreetSrc,
  recoveryKeyWords,
} from "../lib/citizenship-induction";
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
import {
  inspectRestorePapers,
  pickRestoreFile,
  type InspectRestorePapersResult,
} from "../lib/inspect-restore-papers";
import { EnteredWorldSchema, type EnteredWorld } from "../schemas/entered-world";
import type { InductionStepId } from "../schemas/citizenship-induction";

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
  const [step, setStep] = useState<InductionStepId>("welcome");
  const [phrase] = useState(generatePhrase);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sid, setSid] = useState<string | null>(null);
  const [sealed, setSealed] = useState<SealedPapers | null>(null);
  const [backupReady, setBackupReady] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreInspect, setRestoreInspect] =
    useState<InspectRestorePapersResult | null>(null);
  const [restoreHover, setRestoreHover] = useState(false);
  const sessionPromise = useRef<Promise<string> | null>(null);
  const restoreTicket = useRef(0);
  const restoreInput = useRef<HTMLInputElement | null>(null);
  const words = recoveryKeyWords(phrase);

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

  const clearRestoreTray = (): void => {
    restoreTicket.current += 1;
    setRestoreFile(null);
    setRestoreInspect(null);
    setRestoreHover(false);
    setError("");
    if (restoreInput.current !== null) {
      restoreInput.current.value = "";
    }
  };

  const reconnectWithPapers = async (options: {
    papers: Extract<InspectRestorePapersResult, { ok: true }>;
    ticket: number;
  }): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      const passwHash = await hashNodePassword(options.papers.passw);
      if (options.ticket !== restoreTicket.current) {
        return;
      }
      const validated = await validateMainNode({
        origin: occupancyOrigin,
        fetchFn,
        nodeId: options.papers.preview.nodeId,
        passwHash,
      });
      if (!validated.ok) {
        throw new Error(validated.reason);
      }
      if (validated.nodeKind !== undefined && validated.nodeKind !== "main") {
        throw new Error("Credentials are not for a main node on this server.");
      }
      const sessionId = await ensureSid();
      if (options.ticket !== restoreTicket.current) {
        return;
      }
      setSid(sessionId);
      setSealed({
        nodeId: options.papers.preview.nodeId,
        passw: options.papers.passw,
        requireBackup: false,
      });
      setBackupReady(true);
      setStep("sealed");
    } catch (reason: unknown) {
      if (options.ticket !== restoreTicket.current) {
        return;
      }
      setError(reason instanceof Error ? reason.message : "Restore failed");
    } finally {
      if (options.ticket === restoreTicket.current) {
        setBusy(false);
      }
    }
  };

  const onPapersChosen = async (file: File | null): Promise<void> => {
    const ticket = restoreTicket.current + 1;
    restoreTicket.current = ticket;
    setRestoreFile(file);
    setRestoreInspect(null);
    setError("");
    if (file === null) {
      return;
    }
    try {
      const text = await readUploadedText(file);
      if (ticket !== restoreTicket.current) {
        return;
      }
      const inspected = inspectRestorePapers({
        text,
        fileName: file.name,
        occupancyOrigin,
      });
      setRestoreInspect(inspected);
      if (!inspected.ok) {
        setError(inspected.reason);
        return;
      }
      await reconnectWithPapers({ papers: inspected, ticket });
    } catch (reason: unknown) {
      if (ticket !== restoreTicket.current) {
        return;
      }
      setError(
        reason instanceof Error ? reason.message : "Could not read credentials.json."
      );
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

  const nextCopy =
    step === "restore" && busy
      ? INDUCTION_NEXT_CHECKING
      : step === "sealed" && sealed !== null && !sealed.requireBackup
        ? INDUCTION_NEXT_RESTORED
        : INDUCTION_NEXT[step];

  return (
    <div
      className={`human-onboard-overlay is-${step}`}
      data-citizenship-onboarding="1"
    >
      <div className="human-onboard-street" aria-hidden="true">
        <img
          className="human-onboard-street-still"
          src={inductionStreetSrc(step)}
          alt=""
        />
      </div>
      <div className="human-onboard-glass" />
      <div className="human-onboard-stage">
        <header className="human-onboard-mast">
          <p className="human-onboard-kicker">Immigration desk</p>
          <p className="human-onboard-brand">{INDUCTION_BRAND}</p>
          <nav aria-label="Induction progress">
            <ol className="human-onboard-track">
              {INDUCTION_TRACK.map((stop) => {
                const isCurrent = stop.steps.some((id) => id === step);
                return (
                  <li
                    key={stop.id}
                    className={
                      isCurrent
                        ? "human-onboard-track-stop is-current"
                        : "human-onboard-track-stop"
                    }
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {stop.label}
                  </li>
                );
              })}
            </ol>
          </nav>
        </header>
        <section className="human-onboard-panel" aria-label="Citizenship">
          <p className="human-onboard-now" role="status" aria-label="What to do now">
            {nextCopy}
          </p>
          {step === "welcome" ? (
            <>
              <h2 className="human-onboard-title">Become a citizen</h2>
              <p className="human-onboard-lead">
                The plaza is behind this glass. Papers first. Then the street
                opens.
              </p>
              <div className="human-onboard-doors">
                {INDUCTION_GATES.map((gate) => (
                  <button
                    key={gate.id}
                    type="button"
                    className={`human-onboard-door human-onboard-door-${gate.id}`}
                    aria-label={`${gate.title}. ${gate.action}`}
                    onClick={() => {
                      setError("");
                      setStep(gate.id === "new" ? "papers" : "restore");
                    }}
                  >
                    <span className="human-onboard-door-kicker">{gate.title}</span>
                    <span className="human-onboard-door-action">{gate.action}</span>
                    <span className="human-onboard-door-hint">{gate.hint}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {step === "papers" ? (
            <>
              <h2 className="human-onboard-title">Issue your papers</h2>
              <p className="human-onboard-lead">
                This booklet is the only copy of your Player ID. Photograph it
                with your eyes, then stamp.
              </p>
              <article className="citizenship-passport" aria-label="Player passport">
                <header className="citizenship-passport-head">
                  <span>{INDUCTION_BRAND}</span>
                  <span>World 2</span>
                </header>
                <ol className="citizenship-passport-words" aria-label="Recovery key">
                  {words.map((word, index) => (
                    <li key={`${word}-${String(index)}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {word}
                    </li>
                  ))}
                </ol>
              </article>
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
              <div className="human-onboard-actions human-onboard-dock">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void onBecomeCitizen();
                  }}
                >
                  Become a citizen
                </button>
                <button
                  type="button"
                  className="human-onboard-secondary"
                  onClick={() => {
                    setError("");
                    setStep("welcome");
                  }}
                >
                  Back to the doors
                </button>
              </div>
            </>
          ) : null}
          {step === "restore" ? (
            <>
              <h2 className="human-onboard-title">Restore citizenship</h2>
              <p className="human-onboard-lead">
                Open the credentials.json you saved, or drop it on this tray. We
                read it here, then check it with occupancy.
              </p>
              <div
                className={
                  restoreHover
                    ? "human-onboard-file-zone is-hover"
                    : "human-onboard-file-zone"
                }
                role="group"
                aria-label="Restore papers tray"
                onDragOver={(event) => {
                  event.preventDefault();
                  setRestoreHover(true);
                }}
                onDragLeave={() => {
                  setRestoreHover(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setRestoreHover(false);
                  void onPapersChosen(pickRestoreFile(event.dataTransfer?.files));
                }}
              >
                <input
                  ref={restoreInput}
                  id="restore-credentials"
                  className="human-onboard-file-input"
                  type="file"
                  accept="application/json,.json"
                  aria-label="Open credentials.json"
                  onChange={(event) => {
                    void onPapersChosen(pickRestoreFile(event.target.files));
                  }}
                />
                <label className="human-onboard-file-label" htmlFor="restore-credentials">
                  <span className="human-onboard-file-kicker">Returning citizen</span>
                  <span className="human-onboard-file-action">Open credentials.json</span>
                  <span className="human-onboard-file-hint">
                    {restoreFile === null
                      ? "Or drop the file on this tray."
                      : restoreFile.name}
                  </span>
                </label>
              </div>
              {restoreInspect !== null && restoreInspect.ok ? (
                <p
                  className="human-onboard-found"
                  role="status"
                  aria-label="Found papers"
                >
                  {restoreInspect.preview.fileName} · {restoreInspect.preview.nodeId}
                </p>
              ) : null}
              <div className="human-onboard-actions human-onboard-dock">
                {restoreInspect !== null &&
                restoreInspect.ok &&
                error.length > 0 ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const papers = restoreInspect;
                      if (papers === null || !papers.ok) {
                        return;
                      }
                      void reconnectWithPapers({
                        papers,
                        ticket: restoreTicket.current,
                      });
                    }}
                  >
                    Try again
                  </button>
                ) : null}
                {restoreFile !== null ? (
                  <button
                    type="button"
                    className="human-onboard-secondary"
                    onClick={clearRestoreTray}
                  >
                    Choose a different file
                  </button>
                ) : null}
                <button
                  type="button"
                  className="human-onboard-secondary"
                  onClick={() => {
                    clearRestoreTray();
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
                  ? "The stamp is down. Take the papers with you or this desk will forget you."
                  : "The stamp remembers you. Walk in."}
              </p>
              <article
                className="citizenship-passport is-stamped"
                aria-label="Player passport"
              >
                <header className="citizenship-passport-head">
                  <span>{INDUCTION_BRAND}</span>
                  <span>Sealed</span>
                </header>
                <p className="human-onboard-node-id">{sealed.nodeId}</p>
                <span className="citizenship-stamp" aria-hidden="true">
                  Admitted
                </span>
              </article>
              <div className="human-onboard-actions human-onboard-dock">
                {sealed.requireBackup ? (
                  <button type="button" onClick={onDownload}>
                    Download credentials.json
                  </button>
                ) : null}
                <button
                  type="button"
                  className="human-onboard-enter"
                  disabled={busy || (sealed.requireBackup && !backupReady)}
                  onClick={() => {
                    void onEnterWorld();
                  }}
                >
                  Enter world
                </button>
                {sealed.requireBackup ? null : (
                  <button
                    type="button"
                    className="human-onboard-secondary"
                    onClick={onDownload}
                  >
                    Download credentials.json
                  </button>
                )}
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
