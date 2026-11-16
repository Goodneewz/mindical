"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { authClient } from "@/lib/auth/client";

type View = "signin" | "signup" | "verify" | "forgot" | "reset";
type Failure = { message: string; status: number; code: string };

// The reset / verify steps are remembered for this browser tab. If the page reloads or the
// session re-checks while you are reading the code in your mail, you come back to the same step.
const FLOW_KEY = "mindical-auth-flow";
const RESUMABLE: View[] = ["verify", "forgot", "reset"];
type SavedFlow = { view: View; email: string; codeSent: boolean };

function readFlow(): SavedFlow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(FLOW_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<SavedFlow>;
    if (!saved.view || !RESUMABLE.includes(saved.view)) return null;
    return { view: saved.view, email: typeof saved.email === "string" ? saved.email : "", codeSent: saved.codeSent === true };
  } catch {
    return null;
  }
}

function saveFlow(flow: SavedFlow | null) {
  try {
    if (flow) window.sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow));
    else window.sessionStorage.removeItem(FLOW_KEY);
  } catch {
    // storage can be unavailable (private mode); the screen just won't be remembered
  }
}

const NETWORK_MESSAGE = "We couldn't reach the server. Check your connection and try again.";

// The sign-in client can either throw an error or return one, depending on the call.
// Both are turned into the same shape here, so the real reason always reaches the screen.
function toFailure(error: unknown, fromResponse: boolean): Failure {
  const e = (error ?? {}) as { message?: unknown; status?: unknown; code?: unknown };
  return {
    message: typeof e.message === "string" ? e.message : "",
    status: typeof e.status === "number" ? e.status : fromResponse ? 400 : 0,
    code: typeof e.code === "string" ? e.code : "",
  };
}

async function attempt(action: () => Promise<unknown>): Promise<Failure | null> {
  try {
    const result = (await action()) as { error?: unknown } | undefined | null;
    return result?.error ? toFailure(result.error, true) : null;
  } catch (error) {
    return toFailure(error, false);
  }
}

function describe(failure: Failure, fallback: string): string {
  if (failure.status === 0) return NETWORK_MESSAGE;
  if (failure.code === "TOO_MANY_ATTEMPTS" || /too many/i.test(failure.message)) return "Too many attempts. Please request a new code.";
  return failure.message || fallback;
}

function needsVerification(failure: Failure): boolean {
  return failure.status === 403 || failure.code === "EMAIL_NOT_VERIFIED" || /not verified/i.test(failure.message);
}

// Turn this on again once your own Google login app is set up in Neon.
const GOOGLE_ENABLED = false;

export function AuthGate({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div className="mindical-app" aria-busy="true" />;
  if (!session) return <AuthScreen />;
  return <>{children}</>;
}

export function AuthScreen() {
  const [saved] = useState(readFlow);
  const [view, setView] = useState<View>(saved?.view ?? "signin");
  const [email, setEmail] = useState(saved?.email ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(saved && saved.view !== "forgot" ? "Enter the 6-digit code we sent to your email." : "");
  const [codeSent, setCodeSent] = useState(saved?.codeSent ?? false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    saveFlow(RESUMABLE.includes(view) ? { view, email, codeSent } : null);
  }, [view, email, codeSent]);

  const cleanEmail = email.trim().toLowerCase();

  const go = (next: View, notice = "") => {
    setView(next);
    setError("");
    setInfo(notice);
    setCode("");
  };

  // Reload so the whole app starts fresh as a signed-in player.
  const enterApp = async (): Promise<boolean> => {
    const check = await authClient.getSession().catch(() => null);
    if (check?.data) {
      saveFlow(null);
      window.location.reload();
      return true;
    }
    return false;
  };

  const submitCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isSignup = view === "signup";

    if (!cleanEmail || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (isSignup && password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    setError("");
    const failure = await attempt(() =>
      isSignup
        ? authClient.signUp.email({ email: cleanEmail, password, name: cleanEmail.split("@")[0] })
        : authClient.signIn.email({ email: cleanEmail, password }),
    );

    if (failure) {
      setBusy(false);
      if (!isSignup && needsVerification(failure)) {
        setCodeSent(false);
        go("verify", "Please verify your email to continue.");
        return;
      }
      setError(describe(failure, "Something went wrong. Please try again."));
      return;
    }

    if (await enterApp()) return;
    setBusy(false);
    if (isSignup) {
      setCodeSent(true);
      setCooldown(30);
      go("verify", `We sent a 6-digit code to ${cleanEmail}.`);
    } else {
      setError("We couldn't sign you in. Please try again.");
    }
  };

  const sendVerificationCode = async () => {
    setBusy(true);
    setError("");
    const failure = await attempt(() => authClient.emailOtp.sendVerificationOtp({ email: cleanEmail, type: "email-verification" }));
    setBusy(false);
    if (failure) {
      setError(describe(failure, "We couldn't send a code. Please try again."));
      return;
    }
    setCodeSent(true);
    setCooldown(30);
    setInfo(`We sent a 6-digit code to ${cleanEmail}.`);
  };

  const submitVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.trim().length < 4) {
      setError("Enter the code from your email.");
      return;
    }
    setBusy(true);
    setError("");
    const failure = await attempt(() => authClient.emailOtp.verifyEmail({ email: cleanEmail, otp: code.trim() }));
    if (failure) {
      setBusy(false);
      setError(describe(failure, "That code isn't right or has expired."));
      return;
    }
    if (await enterApp()) return;
    if (password) {
      const signInFailure = await attempt(() => authClient.signIn.email({ email: cleanEmail, password }));
      if (!signInFailure && (await enterApp())) return;
    }
    setBusy(false);
    go("signin", "Email verified. Please sign in.");
  };

  const sendResetCode = async () => {
    if (!cleanEmail) {
      setError("Enter your email.");
      return false;
    }
    setBusy(true);
    setError("");
    const failure = await attempt(() => authClient.forgetPassword.emailOtp({ email: cleanEmail }));
    setBusy(false);
    if (failure) {
      setError(describe(failure, "We couldn't send a code. Please try again."));
      return false;
    }
    setCooldown(30);
    return true;
  };

  const submitForgot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await sendResetCode()) {
      setPassword("");
      go("reset", "If an account exists for that email, we've sent a 6-digit code.");
    }
  };

  const resendResetCode = async () => {
    if (await sendResetCode()) setInfo("We sent you a new code.");
  };

  const submitReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim()) {
      setError("Enter the code from your email.");
      return;
    }
    if (password.length < 8) {
      setError("Choose a new password with at least 8 characters.");
      return;
    }
    setBusy(true);
    setError("");
    const failure = await attempt(() => authClient.emailOtp.resetPassword({ email: cleanEmail, otp: code.trim(), password }));
    if (failure) {
      setBusy(false);
      setError(describe(failure, "That code isn't right or has expired."));
      return;
    }
    const signInFailure = await attempt(() => authClient.signIn.email({ email: cleanEmail, password }));
    if (!signInFailure && (await enterApp())) return;
    setBusy(false);
    go("signin", "Password updated. Please sign in.");
  };

  const continueWithGoogle = async () => {
    setBusy(true);
    setError("");
    const failure = await attempt(() => authClient.signIn.social({ provider: "google", callbackURL: window.location.origin }));
    if (failure) {
      setError(describe(failure, "Google sign-in didn't work. Please try again."));
      setBusy(false);
    }
  };

  const titles: Record<View, [string, string]> = {
    signin: ["Welcome back", "Sign in to pick up where you left off."],
    signup: ["Create your account", "Save your progress and join the leaderboard."],
    verify: ["Check your email", "Enter the 6-digit code to verify your email."],
    forgot: ["Forgot your password?", "Enter your email and we'll send you a 6-digit code."],
    reset: ["Choose a new password", "Enter the code we sent and pick a new password."],
  };
  const [title, subtitle] = titles[view];
const showGoogle = GOOGLE_ENABLED && (view === "signin" || view === "signup");

  const passwordField = (label: string, placeholder: string, autoComplete: string) => (
    <>
      <label htmlFor="auth-password">{label}</label>
      <div className="auth-password">
        <input id="auth-password" type={showPassword ? "text" : "password"} autoComplete={autoComplete} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={placeholder} />
        <button type="button" className="auth-toggle" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? "Hide" : "Show"}</button>
      </div>
    </>
  );

  const codeField = (
    <>
      <label htmlFor="auth-code">6-digit code</label>
      <input id="auth-code" className="auth-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(event) => setCode(event.target.value.replace(/\s/g, ""))} placeholder="123456" />
    </>
  );

  const emailField = (
    <>
      <label htmlFor="auth-email">Email</label>
      <input id="auth-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
    </>
  );

  const messages = (
    <>
      {info && <small className="auth-info" role="status">{info}</small>}
      {error && <small className="auth-error" role="alert">{error}</small>}
    </>
  );

  const resendLabel = cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code";

  return (
    <div className="mindical-app">
      <div className="modal-backdrop">
        <section className="profile-modal auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <div className="eyebrow modal-eyebrow"><span className="eyebrow-dot" /> WELCOME TO MINDICAL</div>
          <h2 id="auth-title">{title}</h2>
          <p>{subtitle}</p>

          {showGoogle && (
            <>
              <button type="button" className="google-button" onClick={continueWithGoogle} disabled={busy}>
                <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Continue with Google
              </button>
              <div className="auth-divider"><span>or use your email</span></div>
            </>
          )}

          {(view === "signin" || view === "signup") && (
            <form className="profile-form auth-form" onSubmit={submitCredentials} noValidate>
              {emailField}
              {passwordField("Password", view === "signup" ? "At least 8 characters" : "Your password", view === "signup" ? "new-password" : "current-password")}
              {view === "signin" && <button type="button" className="auth-forgot" onClick={() => go("forgot")}>Forgot password?</button>}
              {messages}
              <button type="submit" className="primary-button auth-submit" disabled={busy}>{busy ? "Please wait…" : view === "signup" ? "Create account" : "Sign in"}</button>
            </form>
          )}

          {view === "verify" && (
            <form className="profile-form auth-form" onSubmit={submitVerify} noValidate>
              {messages}
              {codeSent ? (
                <>
                  {codeField}
                  <button type="submit" className="primary-button auth-submit" disabled={busy}>{busy ? "Please wait…" : "Verify email"}</button>
                  <button type="button" className="auth-switch" onClick={sendVerificationCode} disabled={busy || cooldown > 0}>{resendLabel}</button>
                </>
              ) : (
                <button type="button" className="primary-button auth-submit" onClick={sendVerificationCode} disabled={busy}>{busy ? "Please wait…" : "Send me a code"}</button>
              )}
            </form>
          )}

          {view === "forgot" && (
            <form className="profile-form auth-form" onSubmit={submitForgot} noValidate>
              {emailField}
              {messages}
              <button type="submit" className="primary-button auth-submit" disabled={busy}>{busy ? "Please wait…" : "Send code"}</button>
            </form>
          )}

          {view === "reset" && (
            <form className="profile-form auth-form" onSubmit={submitReset} noValidate>
              {messages}
              {codeField}
              {passwordField("New password", "At least 8 characters", "new-password")}
              <button type="submit" className="primary-button auth-submit" disabled={busy}>{busy ? "Please wait…" : "Update password"}</button>
              <button type="button" className="auth-switch" onClick={resendResetCode} disabled={busy || cooldown > 0}>{resendLabel}</button>
            </form>
          )}

          {(view === "signin" || view === "signup") ? (
            <button type="button" className="auth-switch" onClick={() => go(view === "signup" ? "signin" : "signup")}>
              {view === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
          ) : (
            <button type="button" className="auth-switch" onClick={() => go("signin")}>Back to sign in</button>
          )}
        </section>
      </div>
    </div>
  );
}
