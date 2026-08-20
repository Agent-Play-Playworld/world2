import { useState, type FormEvent } from "react";
import { registerLaunchInterest } from "../lib/launch-interest";

type LaunchInterestFormState =
  | { status: "idle"; error: null }
  | { status: "error"; error: string }
  | { status: "saved"; error: null };

export const LaunchInterestForm = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<LaunchInterestFormState>({
    status: "idle",
    error: null,
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const interest =
      name.trim().length > 0 ? { email, name: name.trim() } : { email };
    const result = registerLaunchInterest({
      storage: window.localStorage,
      interest,
    });
    if (!result.ok) {
      setState({ status: "error", error: result.reason });
      return;
    }
    setState({ status: "saved", error: null });
  };

  if (state.status === "saved") {
    return (
      <p className="form-success">
        We will tell you when World 2 launches.
      </p>
    );
  }

  return (
    <form className="interest-form" onSubmit={onSubmit}>
      <label className="field">
        <span>Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
      </label>
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </label>
      {state.error !== null ? <p className="form-error">{state.error}</p> : null}
      <button className="cta" type="submit">
        Show interest in the game launch
      </button>
    </form>
  );
};
