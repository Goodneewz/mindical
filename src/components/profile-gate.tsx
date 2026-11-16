"use client";

import { useEffect, useState, type FormEvent } from "react";
import MindicalApp from "@/components/mindical-app";
import { authClient } from "@/lib/auth/client";
import { USERNAME_HINT, validateUsername } from "@/lib/username";

type Profile = { id: string; displayName: string; xp: number; streak: number; lastPlayedAt: string | null };
type State =
  | { kind: "loading" }
  | { kind: "needs-username" }
  | { kind: "ready"; profile: Profile }
  | { kind: "signed-out" }
  | { kind: "error" };

// Sits between sign-in and the game: the game only opens once the signed-in person has a username.
export function ProfileGate() {
  const [state, setState] = useState<State>({ kind: "loading" });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (cancelled) return;
        if (response.status === 401) {
          setState({ kind: "signed-out" });
          return;
        }
        if (response.status === 404) {
          setState({ kind: "needs-username" });
          return;
        }
        if (!response.ok) throw new Error("Profile request failed");
        const payload = (await response.json()) as { profile: Profile };
        if (!cancelled) setState({ kind: "ready", profile: payload.profile });
      } catch {
        if (!cancelled) setState({ kind: "error" });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    setState({ kind: "loading" });
    setAttempt((count) => count + 1);
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
    } finally {
      window.location.reload();
    }
  };

  if (state.kind === "loading") return <div className="mindical-app" aria-busy="true" />;
  if (state.kind === "ready") return <MindicalApp initialProfile={state.profile} />;
  if (state.kind === "needs-username") return <UsernameScreen onDone={(profile) => setState({ kind: "ready", profile })} />;

  const signedOut = state.kind === "signed-out";
  return (
    <div className="mindical-app">
      <div className="modal-backdrop">
        <section className="profile-modal auth-card" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <h2 id="gate-title">{signedOut ? "Please sign in again" : "We couldn't load your profile"}</h2>
          <p>{signedOut ? "Your session has ended." : "Check your connection and try again."}</p>
          <button type="button" className="primary-button auth-submit" onClick={signedOut ? signOut : retry}>{signedOut ? "Sign in" : "Try again"}</button>
        </section>
      </div>
    </div>
  );
}

export function UsernameScreen({ onDone }: { onDone: (profile: Profile) => void }) {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = validateUsername(username);
    if (problem) {
      setError(problem);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: username.trim() }),
      });
      const payload = (await response.json().catch(() => null)) as { profile?: Profile; error?: string } | null;
      if (!response.ok || !payload?.profile) {
        setError(payload?.error ?? "We couldn't save your username. Please try again.");
        return;
      }
      onDone(payload.profile);
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mindical-app">
      <div className="modal-backdrop">
        <section className="profile-modal auth-card" role="dialog" aria-modal="true" aria-labelledby="username-title">
          <div className="eyebrow modal-eyebrow"><span className="eyebrow-dot" /> ONE LAST STEP</div>
          <h2 id="username-title">Choose your username</h2>
          <p>This is the name other players see on the leaderboard. It doesn&apos;t have to be your real name.</p>
          <form className="profile-form auth-form" onSubmit={submit} noValidate>
            <label htmlFor="username">Username</label>
            <input id="username" autoFocus maxLength={20} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="e.g. brainy.fox" />
            <small className="auth-hint">{USERNAME_HINT}</small>
            {error && <small className="auth-error" role="alert">{error}</small>}
            <button type="submit" className="primary-button auth-submit" disabled={busy}>{busy ? "Please wait…" : "Start playing"}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
