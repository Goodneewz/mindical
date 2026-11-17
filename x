[35msrc/app/api/auth/[...path]/route.ts[m[36m:[m[32m1[m[36m:[mimport { [1;31mauth[m } from "@/lib/[1;31mauth[m/server";
[35msrc/app/api/auth/[...path]/route.ts[m[36m:[m[32m3[m[36m:[mexport const { GET, POST } = [1;31mauth[m.handler();
[35msrc/app/api/dashboard/route.ts[m[36m:[m[32m4[m[36m:[mimport { getUserId } from "@/lib/[1;31mauth[m/session";
[35msrc/app/api/dashboard/route.ts[m[36m:[m[32m8[m[36m:[m// The [1;31mleaderboard[m is the same for everyone, so each server instance keeps it for a few seconds.
[35msrc/app/api/dashboard/route.ts[m[36m:[m[32m10[m[36m:[mconst [1;31mLEADERBOARD[m_TTL_MS = 10_000;
[35msrc/app/api/dashboard/route.ts[m[36m:[m[32m11[m[36m:[mtype [1;31mLeaderboard[mRow = { id: string; displayName: string; xp: number; streak: number };
[35msrc/app/api/dashboard/route.ts[m[36m:[m[32m12[m[36m:[mlet [1;31mleaderboard[mCache: { at: number; rows: [1;31mLeaderboard[mRow[] } | null = null;
[35msrc/app/api/dashboard/route.ts[m[36m:[m[32m14[m[36m:[masync function load[1;31mLeaderboard[m(): Promise<[1;31mLeaderboard[mRow[]> {
[35msrc/app/api/dashboard/route.ts[m[36m:[m[32m16[m[36m:[m  if ([1;31mleaderboard[mCache && now - [1;31mleaderboard[mCache.at < [1;31mLEADERBOARD[m_TTL_MS) return [1;31mleaderboard[mCache.rows;
[35msrc/app/api/dashboard/route.ts[m[36m:[m[32m30[m[36m:[m  [1;31mleaderboard[mCache = { at: now, rows };
[35msrc/app/api/dashboard/route.ts[m[36m:[m[32m36[m[36m:[m  if (!userId) return Response.json({ error: "Please [1;31msign in[m." }, { status: 401 });
[35msrc/app/api/dashboard/route.ts[m[36m:[m[32m45[m[36m:[m    const [sessions, [1;31mleaderboard[m] = await Promise.all([
[35msrc/app/api/dashboard/route.ts[m[36m:[m[32m50[m[36m:[m          [1;31mscore[m: mindicalSessions.[1;31mscore[m,
[35msrc/app/api/dashboard/route.ts[m[36m:[m[32m61[m[36m:[m      load[1;31mLeaderboard[m(),
[35msrc/app/api/dashboard/route.ts[m[36m:[m[32m64[m[36m:[m    return Response.json({ profile, sessions, [1;31mleaderboard[m });
[35msrc/app/api/profile/route.ts[m[36m:[m[32m4[m[36m:[mimport { getUserId } from "@/lib/[1;31mauth[m/session";
[35msrc/app/api/profile/route.ts[m[36m:[m[32m30[m[36m:[m  if (!userId) return Response.json({ error: "Please [1;31msign in[m." }, { status: 401 });
[35msrc/app/api/profile/route.ts[m[36m:[m[32m44[m[36m:[m  if (!userId) return Response.json({ error: "Please [1;31msign in[m." }, { status: 401 });
[35msrc/app/api/sessions/route.ts[m[36m:[m[32m4[m[36m:[mimport { getUserId } from "@/lib/[1;31mauth[m/session";
[35msrc/app/api/sessions/route.ts[m[36m:[m[32m25[m[36m:[m  if (!playerId) return Response.json({ error: "Please [1;31msign in[m." }, { status: 401 });
[35msrc/app/api/sessions/route.ts[m[36m:[m[32m41[m[36m:[m  const [1;31mscore[m = values.[1;31mscore[m;
[35msrc/app/api/sessions/route.ts[m[36m:[m[32m49[m[36m:[m    !isIntegerInRange([1;31mscore[m, 0, 50_000) ||
[35msrc/app/api/sessions/route.ts[m[36m:[m[32m58[m[36m:[m  const xpEarned = Math.min(200, Math.max(12, Math.round([1;31mscore[m / 75 + accuracy * 0.32)));
[35msrc/app/api/sessions/route.ts[m[36m:[m[32m92[m[36m:[m          [1;31mscore[m,
[35msrc/app/page.tsx[m[36m:[m[32m1[m[36m:[mimport { [1;31mAuth[mGate } from "@/components/[1;31mauth[m-gate";
[35msrc/app/page.tsx[m[36m:[m[32m6[m[36m:[m    <[1;31mAuth[mGate>
[35msrc/app/page.tsx[m[36m:[m[32m8[m[36m:[m    </[1;31mAuth[mGate>
[35msrc/app/sign-in/page.tsx[m[36m:[m[32m1[m[36m:[mimport { [1;31mredirect[m } from "next/navigation";
[35msrc/app/sign-in/page.tsx[m[36m:[m[32m3[m[36m:[m// The [1;31msign-in[m screen lives on the home page. If a Google [1;31msign-in[m can't be finished,
[35msrc/app/sign-in/page.tsx[m[36m:[m[32m4[m[36m:[m// the [1;31mauth[m middleware sends people here, and this sends them on to the home page.
[35msrc/app/sign-in/page.tsx[m[36m:[m[32m5[m[36m:[mexport default function [1;31mSignIn[m[1;31mRedirect[m() {
[35msrc/app/sign-in/page.tsx[m[36m:[m[32m6[m[36m:[m  [1;31mredirect[m("/");
[35msrc/components/auth-gate.tsx[m[36m:[m[32m4[m[36m:[mimport { [1;31mauth[mClient } from "@/lib/[1;31mauth[m/client";
[35msrc/components/auth-gate.tsx[m[36m:[m[32m6[m[36m:[mtype View = "[1;31msignin[m" | "[1;31msignup[m" | "verify" | "forgot" | "reset";
[35msrc/components/auth-gate.tsx[m[36m:[m[32m11[m[36m:[mconst FLOW_KEY = "mindical-[1;31mauth[m-flow";
[35msrc/components/auth-gate.tsx[m[36m:[m[32m39[m[36m:[m// The [1;31msign-in[m client can either throw an error or return one, depending on the call.
[35msrc/components/auth-gate.tsx[m[36m:[m[32m69[m[36m:[mexport function [1;31mAuth[mGate({ children }: { children: ReactNode }) {
[35msrc/components/auth-gate.tsx[m[36m:[m[32m70[m[36m:[m  const { data: session, isPending } = [1;31mauth[mClient.useSession();
[35msrc/components/auth-gate.tsx[m[36m:[m[32m73[m[36m:[m  if (!session) return <[1;31mAuth[mScreen />;
[35msrc/components/auth-gate.tsx[m[36m:[m[32m77[m[36m:[mexport function [1;31mAuth[mScreen() {
[35msrc/components/auth-gate.tsx[m[36m:[m[32m79[m[36m:[m  const [view, setView] = useState<View>(saved?.view ?? "[1;31msignin[m");
[35msrc/components/auth-gate.tsx[m[36m:[m[32m111[m[36m:[m    const check = await [1;31mauth[mClient.getSession().catch(() => null);
[35msrc/components/auth-gate.tsx[m[36m:[m[32m122[m[36m:[m    const is[1;31mSignup[m = view === "[1;31msignup[m";
[35msrc/components/auth-gate.tsx[m[36m:[m[32m128[m[36m:[m    if (is[1;31mSignup[m && password.length < 8) {
[35msrc/components/auth-gate.tsx[m[36m:[m[32m136[m[36m:[m      is[1;31mSignup[m
[35msrc/components/auth-gate.tsx[m[36m:[m[32m137[m[36m:[m        ? [1;31mauth[mClient.[1;31msignUp[m.email({ email: cleanEmail, password, name: cleanEmail.split("@")[0] })
[35msrc/components/auth-gate.tsx[m[36m:[m[32m138[m[36m:[m        : [1;31mauth[mClient.[1;31msignIn[m.email({ email: cleanEmail, password }),
[35msrc/components/auth-gate.tsx[m[36m:[m[32m143[m[36m:[m      if (!is[1;31mSignup[m && needsVerification(failure)) {
[35msrc/components/auth-gate.tsx[m[36m:[m[32m154[m[36m:[m    if (is[1;31mSignup[m) {
[35msrc/components/auth-gate.tsx[m[36m:[m[32m166[m[36m:[m    const failure = await attempt(() => [1;31mauth[mClient.emailOtp.sendVerificationOtp({ email: cleanEmail, type: "email-verification" }));
[35msrc/components/auth-gate.tsx[m[36m:[m[32m185[m[36m:[m    const failure = await attempt(() => [1;31mauth[mClient.emailOtp.verifyEmail({ email: cleanEmail, otp: code.trim() }));
[35msrc/components/auth-gate.tsx[m[36m:[m[32m193[m[36m:[m      const [1;31msignIn[mFailure = await attempt(() => [1;31mauth[mClient.[1;31msignIn[m.email({ email: cleanEmail, password }));
[35msrc/components/auth-gate.tsx[m[36m:[m[32m194[m[36m:[m      if (![1;31msignIn[mFailure && (await enterApp())) return;
[35msrc/components/auth-gate.tsx[m[36m:[m[32m197[m[36m:[m    go("[1;31msignin[m", "Email verified. Please [1;31msign in[m.");
[35msrc/components/auth-gate.tsx[m[36m:[m[32m207[m[36m:[m    const failure = await attempt(() => [1;31mauth[mClient.forgetPassword.emailOtp({ email: cleanEmail }));
[35msrc/components/auth-gate.tsx[m[36m:[m[32m241[m[36m:[m    const failure = await attempt(() => [1;31mauth[mClient.emailOtp.resetPassword({ email: cleanEmail, otp: code.trim(), password }));
[35msrc/components/auth-gate.tsx[m[36m:[m[32m247[m[36m:[m    const [1;31msignIn[mFailure = await attempt(() => [1;31mauth[mClient.[1;31msignIn[m.email({ email: cleanEmail, password }));
[35msrc/components/auth-gate.tsx[m[36m:[m[32m248[m[36m:[m    if (![1;31msignIn[mFailure && (await enterApp())) return;
[35msrc/components/auth-gate.tsx[m[36m:[m[32m250[m[36m:[m    go("[1;31msignin[m", "Password updated. Please [1;31msign in[m.");
[35msrc/components/auth-gate.tsx[m[36m:[m[32m256[m[36m:[m    const failure = await attempt(() => [1;31mauth[mClient.[1;31msignIn[m.social({ provider: "google", callbackURL: window.location.origin }));
[35msrc/components/auth-gate.tsx[m[36m:[m[32m258[m[36m:[m      setError(describe(failure, "Google [1;31msign-in[m didn't work. Please try again."));
[35msrc/components/auth-gate.tsx[m[36m:[m[32m264[m[36m:[m    [1;31msignin[m: ["Welcome back", "[1;31mSign in[m to pick up where you left off."],
[35msrc/components/auth-gate.tsx[m[36m:[m[32m265[m[36m:[m    [1;31msignup[m: ["Create your account", "Save your progress and join the [1;31mleaderboard[m."],
[35msrc/components/auth-gate.tsx[m[36m:[m[32m271[m[36m:[m  const showGoogle = view === "[1;31msignin[m" || view === "[1;31msignup[m";
[35msrc/components/auth-gate.tsx[m[36m:[m[32m275[m[36m:[m      <label htmlFor="[1;31mauth[m-password">{label}</label>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m276[m[36m:[m      <div className="[1;31mauth[m-password">
[35msrc/components/auth-gate.tsx[m[36m:[m[32m277[m[36m:[m        <input id="[1;31mauth[m-password" type={showPassword ? "text" : "password"} autoComplete={autoComplete} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={placeholder} />
[35msrc/components/auth-gate.tsx[m[36m:[m[32m278[m[36m:[m        <button type="button" className="[1;31mauth[m-toggle" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? "Hide" : "Show"}</button>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m285[m[36m:[m      <label htmlFor="[1;31mauth[m-code">6-digit code</label>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m286[m[36m:[m      <input id="[1;31mauth[m-code" className="[1;31mauth[m-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(event) => setCode(event.target.value.replace(/\s/g, ""))} placeholder="123456" />
[35msrc/components/auth-gate.tsx[m[36m:[m[32m292[m[36m:[m      <label htmlFor="[1;31mauth[m-email">Email</label>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m293[m[36m:[m      <input id="[1;31mauth[m-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
[35msrc/components/auth-gate.tsx[m[36m:[m[32m299[m[36m:[m      {info && <small className="[1;31mauth[m-info" role="status">{info}</small>}
[35msrc/components/auth-gate.tsx[m[36m:[m[32m300[m[36m:[m      {error && <small className="[1;31mauth[m-error" role="alert">{error}</small>}
[35msrc/components/auth-gate.tsx[m[36m:[m[32m309[m[36m:[m        <section className="profile-modal [1;31mauth[m-card" role="dialog" aria-modal="true" aria-labelledby="[1;31mauth[m-title">
[35msrc/components/auth-gate.tsx[m[36m:[m[32m311[m[36m:[m          <h2 id="[1;31mauth[m-title">{title}</h2>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m325[m[36m:[m              <div className="[1;31mauth[m-divider"><span>or use your email</span></div>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m329[m[36m:[m          {(view === "[1;31msignin[m" || view === "[1;31msignup[m") && (
[35msrc/components/auth-gate.tsx[m[36m:[m[32m330[m[36m:[m            <form className="profile-form [1;31mauth[m-form" onSubmit={submitCredentials} noValidate>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m332[m[36m:[m              {passwordField("Password", view === "[1;31msignup[m" ? "At least 8 characters" : "Your password", view === "[1;31msignup[m" ? "new-password" : "current-password")}
[35msrc/components/auth-gate.tsx[m[36m:[m[32m333[m[36m:[m              {view === "[1;31msignin[m" && <button type="button" className="[1;31mauth[m-forgot" onClick={() => go("forgot")}>Forgot password?</button>}
[35msrc/components/auth-gate.tsx[m[36m:[m[32m335[m[36m:[m              <button type="submit" className="primary-button [1;31mauth[m-submit" disabled={busy}>{busy ? "Please wait…" : view === "[1;31msignup[m" ? "Create account" : "[1;31mSign in[m"}</button>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m340[m[36m:[m            <form className="profile-form [1;31mauth[m-form" onSubmit={submitVerify} noValidate>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m345[m[36m:[m                  <button type="submit" className="primary-button [1;31mauth[m-submit" disabled={busy}>{busy ? "Please wait…" : "Verify email"}</button>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m346[m[36m:[m                  <button type="button" className="[1;31mauth[m-switch" onClick={sendVerificationCode} disabled={busy || cooldown > 0}>{resendLabel}</button>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m349[m[36m:[m                <button type="button" className="primary-button [1;31mauth[m-submit" onClick={sendVerificationCode} disabled={busy}>{busy ? "Please wait…" : "Send me a code"}</button>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m355[m[36m:[m            <form className="profile-form [1;31mauth[m-form" onSubmit={submitForgot} noValidate>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m358[m[36m:[m              <button type="submit" className="primary-button [1;31mauth[m-submit" disabled={busy}>{busy ? "Please wait…" : "Send code"}</button>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m363[m[36m:[m            <form className="profile-form [1;31mauth[m-form" onSubmit={submitReset} noValidate>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m367[m[36m:[m              <button type="submit" className="primary-button [1;31mauth[m-submit" disabled={busy}>{busy ? "Please wait…" : "Update password"}</button>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m368[m[36m:[m              <button type="button" className="[1;31mauth[m-switch" onClick={resendResetCode} disabled={busy || cooldown > 0}>{resendLabel}</button>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m372[m[36m:[m          {(view === "[1;31msignin[m" || view === "[1;31msignup[m") ? (
[35msrc/components/auth-gate.tsx[m[36m:[m[32m373[m[36m:[m            <button type="button" className="[1;31mauth[m-switch" onClick={() => go(view === "[1;31msignup[m" ? "[1;31msignin[m" : "[1;31msignup[m")}>
[35msrc/components/auth-gate.tsx[m[36m:[m[32m374[m[36m:[m              {view === "[1;31msignup[m" ? "Already have an account? [1;31mSign in[m" : "New here? Create an account"}
[35msrc/components/auth-gate.tsx[m[36m:[m[32m377[m[36m:[m            <button type="button" className="[1;31mauth[m-switch" onClick={() => go("[1;31msignin[m")}>Back to [1;31msign in[m</button>
[35msrc/components/mindical-app.tsx[m[36m:[m[32m12[m[36m:[mimport { [1;31mauth[mClient } from "@/lib/[1;31mauth[m/client";
[35msrc/components/mindical-app.tsx[m[36m:[m[32m16[m[36m:[mtype Section = "home" | "games" | "progress" | "[1;31mleaderboard[m";
[35msrc/components/mindical-app.tsx[m[36m:[m[32m51[m[36m:[m  [1;31mscore[m: number;
[35msrc/components/mindical-app.tsx[m[36m:[m[32m59[m[36m:[mtype [1;31mLeaderboard[mEntry = {
[35msrc/components/mindical-app.tsx[m[36m:[m[32m69[m[36m:[m  [1;31mleaderboard[m: [1;31mLeaderboard[mEntry[];
[35msrc/components/mindical-app.tsx[m[36m:[m[32m74[m[36m:[m  [1;31mscore[m: number;
[35msrc/components/mindical-app.tsx[m[36m:[m[32m165[m[36m:[m    howTo: "Watch the sequence · Tap each tile in order · One clean run earns a perfect [1;31mscore[m",
[35msrc/components/mindical-app.tsx[m[36m:[m[32m194[m[36m:[m  { id: "[1;31mleaderboard[m", label: "[1;31mLeaderboard[m", icon: "trophy" },
[35msrc/components/mindical-app.tsx[m[36m:[m[32m473[m[36m:[m  const [[1;31mleaderboard[m, set[1;31mLeaderboard[m] = useState<[1;31mLeaderboard[mEntry[]>([]);
[35msrc/components/mindical-app.tsx[m[36m:[m[32m494[m[36m:[m      set[1;31mLeaderboard[m(payload.[1;31mleaderboard[m);
[35msrc/components/mindical-app.tsx[m[36m:[m[32m556[m[36m:[m      await [1;31mauth[mClient.signOut();
[35msrc/components/mindical-app.tsx[m[36m:[m[32m621[m[36m:[m                {item.label === "Explore games" ? "Games" : item.label === "My progress" ? "Progress" : item.label === "[1;31mLeaderboard[m" ? "Rankings" : item.label}
[35msrc/components/mindical-app.tsx[m[36m:[m[32m823[m[36m:[m                      return <div className="recent-row" key={session.id}><div className={`recent-game-icon tone-${game?.tone ?? "coral"}`}><Icon name={game?.icon ?? "brain"} size={17} /></div><div className="recent-game-name"><strong>{displayGameName(session.mode)}</strong><span>{dayLabel(session.createdAt)}</span></div><span className="recent-accuracy">{session.accuracy}% <small>accuracy</small></span><span className="recent-[1;31mscore[m">{session.[1;31mscore[m.toLocaleString()} <small>pts</small></span><span className="recent-xp">+{session.xpEarned} XP</span></div>;
[35msrc/components/mindical-app.tsx[m[36m:[m[32m841[m[36m:[m          {section === "[1;31mleaderboard[m" && (
[35msrc/components/mindical-app.tsx[m[36m:[m[32m842[m[36m:[m            <section className="page-view [1;31mleaderboard[m-view">
[35msrc/components/mindical-app.tsx[m[36m:[m[32m849[m[36m:[m                <div className="[1;31mleaderboard[m-trophy"><Icon name="trophy" size={28} /></div>
[35msrc/components/mindical-app.tsx[m[36m:[m[32m851[m[36m:[m              <div className="[1;31mleaderboard[m-card">
[35msrc/components/mindical-app.tsx[m[36m:[m[32m852[m[36m:[m                <div className="[1;31mleaderboard[m-card-heading"><div><span className="section-kicker">ALL-TIME MINDICAL COMMUNITY</span><h2>The XP club</h2></div><span className="[1;31mleaderboard[m-live"><i /> LIVE RANKINGS</span></div>
[35msrc/components/mindical-app.tsx[m[36m:[m[32m853[m[36m:[m                {[1;31mleaderboard[m.length ? (
[35msrc/components/mindical-app.tsx[m[36m:[m[32m854[m[36m:[m                  <div className="[1;31mleaderboard[m-list">
[35msrc/components/mindical-app.tsx[m[36m:[m[32m855[m[36m:[m                    {[1;31mleaderboard[m.map((entry, index) => {
[35msrc/components/mindical-app.tsx[m[36m:[m[32m857[m[36m:[m                      return <div className={`[1;31mleaderboard[m-row ${isMe ? "is-me" : ""}`} key={entry.id}><span className={`leader-rank rank-${index + 1}`}>{index < 3 ? ["✦", "✧", "✦"][index] : String(index + 1).padStart(2, "0")}</span><span className={`leader-avatar leader-avatar-${index % 4}`}>{initials(entry.displayName)}</span><span className="leader-name"><strong>{entry.displayName}{isMe && <em>YOU</em>}</strong><small>{entry.streak} day streak</small></span><span className="leader-xp"><strong>{entry.xp.toLocaleString()}</strong><small>XP</small></span></div>;
[35msrc/components/mindical-app.tsx[m[36m:[m[32m861[m[36m:[m                <div className="[1;31mleaderboard[m-footnote"><Icon name="sparkle" size={15} /> Just a friendly nudge. Your progress is your own.</div>
[35msrc/components/mindical-app.tsx[m[36m:[m[32m863[m[36m:[m              <div className="[1;31mleaderboard[m-side-note"><div className="note-icon"><Icon name="award" size={22} /></div><div><strong>Every practice is a win.</strong><span>[1;31mScore[ms help us celebrate your effort—not define your ability.</span></div></div>
[35msrc/components/mindical-app.tsx[m[36m:[m[32m888[m[36m:[m          <section className="mini-[1;31mleaderboard[m">
[35msrc/components/mindical-app.tsx[m[36m:[m[32m889[m[36m:[m            <div className="mini-heading"><div><span className="section-kicker">GOOD COMPANY</span><h3>Top learners</h3></div><button onClick={() => navTo("[1;31mleaderboard[m")} aria-label="View [1;31mleaderboard[m"><Icon name="arrow" size={15} /></button></div>
[35msrc/components/mindical-app.tsx[m[36m:[m[32m890[m[36m:[m            {[1;31mleaderboard[m.length ? [1;31mleaderboard[m.slice(0, 3).map((entry, index) => <div className="mini-leader-row" key={entry.id}><span className="mini-place">{String(index + 1).padStart(2, "0")}</span><span className={`mini-avatar mini-avatar-${index}`}>{initials(entry.displayName)}</span><span className="mini-name">{entry.displayName}{entry.id === profile.id && <i>YOU</i>}</span><strong>{entry.xp.toLocaleString()}</strong></div>) : <p className="mini-empty">A little friendly inspiration goes a long way.</p>}
[35msrc/components/mindical-app.tsx[m[36m:[m[32m891[m[36m:[m            <button className="mini-view-all" onClick={() => navTo("[1;31mleaderboard[m")}>See the [1;31mleaderboard[m <Icon name="arrow" size={13} /></button>
[35msrc/components/mindical-app.tsx[m[36m:[m[32m945[m[36m:[m      {library && <div className="library-game-extra"><span className="game-skill-label"><Icon name="brain" size={13} /> {game.skill}</span><span>{latest ? `Best ${latest.[1;31mscore[m.toLocaleString()} pts` : "Ready when you are"}</span></div>}
[35msrc/components/mindical-app.tsx[m[36m:[m[32m946[m[36m:[m      {!library && latest && <div className="last-[1;31mscore[m"><Icon name="award" size={14} /> Latest {latest.accuracy}% accuracy</div>}
[35msrc/components/mindical-app.tsx[m[36m:[m[32m1022[m[36m:[m  const [1;31mscore[mRef = useRef(0);
[35msrc/components/mindical-app.tsx[m[36m:[m[32m1030[m[36m:[m  const finishRun = useCallback(([1;31mscore[m: number, accuracy: number, bestStreak = bestStreakRef.current) => {
[35msrc/components/mindical-app.tsx[m[36m:[m[32m1036[m[36m:[m      [1;31mscore[m: Math.max(0, Math.round([1;31mscore[m)),
[35msrc/components/mindical-app.tsx[m[36m:[m[32m1056[m[36m:[m    finishRun([1;31mscore[mRef.current, accuracy);
[35msrc/components/mindical-app.tsx[m[36m:[m[32m1060[m[36m:[m    [1;31mscore[mRef.current = 0;
[35msrc/components/mindical-app.tsx[m[36m:[m[32m1142[m[36m:[m      [1;31mscore[mRef.current += 90 + Math.min(currentStreakRef.current, 6) * 15;
[35msrc/components/mindical-app.tsx[m[36m:[m[32m1179[m[36m:[m      window.setTimeout(() => finishRun([1;31mscore[mRef.current, Math.round((correctRef.current / memorySequence.length) * 100)), 480);
[35msrc/components/mindical-app.tsx[m[36m:[m[32m1186[m[36m:[m    [1;31mscore[mRef.current += 115;
[35msrc/components/mindical-app.tsx[m[36m:[m[32m1193[m[36m:[m      window.setTimeout(() => finishRun([1;31mscore[mRef.current, 100), 450);
[35msrc/components/mindical-app.tsx[m[36m:[m[32m1213[m[36m:[m    [1;31mscore[mRef.current += 100;
[35msrc/components/mindical-app.tsx[m[36m:[m[32m1235[m[36m:[m    const [1;31mscore[m = Math.max(0, Math.round(600 - difference * 115));
[35msrc/components/mindical-app.tsx[m[36m:[m[32m1237[m[36m:[m    finishRun([1;31mscore[m, accuracy, 0);
[35msrc/components/mindical-app.tsx[m[36m:[m[32m1373[m[36m:[m            <div className="result-metrics"><div><span>YOUR [1;31mSCORE[m</span><strong>{summary.[1;31mscore[m.toLocaleString()}</strong></div><div><span>ACCURACY</span><strong>{summary.accuracy}<small>%</small></strong></div><div><span>BEST STREAK</span><strong>{summary.bestStreak}<small>×</small></strong></div></div>
[35msrc/components/profile-gate.tsx[m[36m:[m[32m5[m[36m:[mimport { [1;31mauth[mClient } from "@/lib/[1;31mauth[m/client";
[35msrc/components/profile-gate.tsx[m[36m:[m[32m16[m[36m:[m// Sits between [1;31msign-in[m and the game: the game only opens once the signed-in person has a username.
[35msrc/components/profile-gate.tsx[m[36m:[m[32m58[m[36m:[m      await [1;31mauth[mClient.signOut();
[35msrc/components/profile-gate.tsx[m[36m:[m[32m72[m[36m:[m        <section className="profile-modal [1;31mauth[m-card" role="dialog" aria-modal="true" aria-labelledby="gate-title">
[35msrc/components/profile-gate.tsx[m[36m:[m[32m73[m[36m:[m          <h2 id="gate-title">{signedOut ? "Please [1;31msign in[m again" : "We couldn't load your profile"}</h2>
[35msrc/components/profile-gate.tsx[m[36m:[m[32m75[m[36m:[m          <button type="button" className="primary-button [1;31mauth[m-submit" onClick={signedOut ? signOut : retry}>{signedOut ? "[1;31mSign in[m" : "Try again"}</button>
[35msrc/components/profile-gate.tsx[m[36m:[m[32m119[m[36m:[m        <section className="profile-modal [1;31mauth[m-card" role="dialog" aria-modal="true" aria-labelledby="username-title">
[35msrc/components/profile-gate.tsx[m[36m:[m[32m122[m[36m:[m          <p>This is the name other players see on the [1;31mleaderboard[m. It doesn&apos;t have to be your real name.</p>
[35msrc/components/profile-gate.tsx[m[36m:[m[32m123[m[36m:[m          <form className="profile-form [1;31mauth[m-form" onSubmit={submit} noValidate>
[35msrc/components/profile-gate.tsx[m[36m:[m[32m126[m[36m:[m            <small className="[1;31mauth[m-hint">{USERNAME_HINT}</small>
[35msrc/components/profile-gate.tsx[m[36m:[m[32m127[m[36m:[m            {error && <small className="[1;31mauth[m-error" role="alert">{error}</small>}
[35msrc/components/profile-gate.tsx[m[36m:[m[32m128[m[36m:[m            <button type="submit" className="primary-button [1;31mauth[m-submit" disabled={busy}>{busy ? "Please wait…" : "Start playing"}</button>
[35msrc/db/schema.ts[m[36m:[m[32m41[m[36m:[m    [1;31mscore[m: integer("[1;31mscore[m").notNull(),
[35msrc/db/schema.ts[m[36m:[m[32m55[m[36m:[m    index("mindical_sessions_[1;31mscore[m_idx").on(table.[1;31mscore[m),
[35msrc/lib/auth/client.ts[m[36m:[m[32m3[m[36m:[mimport { create[1;31mAuth[mClient } from "@neondatabase/[1;31mauth[m/next";
[35msrc/lib/auth/client.ts[m[36m:[m[32m5[m[36m:[mexport const [1;31mauth[mClient = create[1;31mAuth[mClient();
[35msrc/lib/auth/server.ts[m[36m:[m[32m1[m[36m:[mimport { createNeon[1;31mAuth[m } from "@neondatabase/[1;31mauth[m/next/server";
[35msrc/lib/auth/server.ts[m[36m:[m[32m3[m[36m:[mexport const [1;31mauth[m = createNeon[1;31mAuth[m({
[35msrc/lib/auth/server.ts[m[36m:[m[32m4[m[36m:[m  baseUrl: process.env.NEON_[1;31mAUTH[m_BASE_URL!,
[35msrc/lib/auth/server.ts[m[36m:[m[32m6[m[36m:[m    secret: process.env.NEON_[1;31mAUTH[m_COOKIE_SECRET!,
[35msrc/lib/auth/session.ts[m[36m:[m[32m1[m[36m:[mimport { [1;31mauth[m } from "@/lib/[1;31mauth[m/server";
[35msrc/lib/auth/session.ts[m[36m:[m[32m3[m[36m:[m// The signed-in user's ID, read from the [1;31mlogin[m cookie by the server. Never trust an ID sent by the browser.
[35msrc/lib/auth/session.ts[m[36m:[m[32m6[m[36m:[m    const { data } = await [1;31mauth[m.getSession();
[35msrc/lib/username.ts[m[36m:[m[32m1[m[36m:[m// Username rules, shared by the [1;31msign-up[m screen (browser) and the server.
[35msrc/proxy.ts[m[36m:[m[32m1[m[36m:[mimport { [1;31mauth[m } from "@/lib/[1;31mauth[m/server";
[35msrc/proxy.ts[m[36m:[m[32m3[m[36m:[m// Finishes the Google [1;31msign-in[m: when Google sends the player back with a one-time
[35msrc/proxy.ts[m[36m:[m[32m4[m[36m:[m// token in the address, this swaps it for the [1;31mlogin[m cookie and removes it from the URL.
[35msrc/proxy.ts[m[36m:[m[32m5[m[36m:[m// [1;31mlogin[mUrl must NOT be "/" (the package skips the swap on the [1;31mlogin[m page itself).
[35msrc/proxy.ts[m[36m:[m[32m6[m[36m:[mexport default [1;31mauth[m.middleware({ [1;31mlogin[mUrl: "/[1;31msign-in[m" });
[35msrc/proxy.ts[m[36m:[m[32m9[m[36m:[m  matcher: [{ source: "/:path*", has: [{ type: "query", key: "neon_[1;31mauth[m_session_verifier" }] }],
