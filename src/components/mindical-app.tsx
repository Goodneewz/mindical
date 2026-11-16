"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { authClient } from "@/lib/auth/client";
import { cleanUsername, validateUsername } from "@/lib/username";

type GameMode = "tracking" | "stroop" | "memory" | "speed";
type Section = "home" | "games" | "progress" | "leaderboard";
type IconName =
  | "home"
  | "grid"
  | "chart"
  | "trophy"
  | "sparkle"
  | "clock"
  | "arrow"
  | "chevron"
  | "flame"
  | "target"
  | "zap"
  | "brain"
  | "bars"
  | "check"
  | "close"
  | "user"
  | "play"
  | "award"
  | "calendar"
  | "menu";

type LearnerProfile = {
  id: string;
  displayName: string;
  xp: number;
  streak: number;
  lastPlayedAt: string | null;
  createdAt?: string;
};

type SavedSession = {
  id: number;
  mode: string;
  score: number;
  accuracy: number;
  durationSeconds: number;
  bestStreak: number;
  xpEarned: number;
  createdAt: string;
};

type LeaderboardEntry = {
  id: string;
  displayName: string;
  xp: number;
  streak: number;
};

type DashboardPayload = {
  profile: LearnerProfile;
  sessions: SavedSession[];
  leaderboard: LeaderboardEntry[];
};

type RunResult = {
  mode: GameMode;
  score: number;
  accuracy: number;
  durationSeconds: number;
  bestStreak: number;
};

type GameInfo = {
  id: GameMode;
  title: string;
  skill: string;
  category: string;
  description: string;
  duration: string;
  difficulty: string;
  icon: IconName;
  tone: string;
  instruction: string;
  howTo: string;
};

type DropColorId = "orange" | "yellow" | "mint" | "sky" | "navy" | "purple" | "pink";

type DropBall = {
  id: number;
  start: number;
  x: number;
  size: number;
  hex: string;
  target: boolean;
};

type DropPlan = {
  balls: DropBall[];
  fall: number;
  targetCount: number;
};

type StroopColor = {
  label: string;
  hex: string;
};

type StroopQuestion = {
  word: StroopColor;
  ink: StroopColor;
  matches: boolean;
};

type SpeedBoard = {
  target: string;
  tiles: string[];
};

const GAMES: GameInfo[] = [
  {
    id: "tracking",
    title: "Orbit count",
    skill: "Visual tracking",
    category: "Attention",
    description: "Keep your eyes on the right things while the field keeps moving.",
    duration: "30–90 sec",
    difficulty: "Easy to learn",
    icon: "target",
    tone: "coral",
    instruction: "Count every ball in your focus color as the balls drop through the field. Keep a quiet tally, then lock in your answer when time is up.",
    howTo: "Watch your focus color · Ignore the rest · Tap Slow down if it gets fast",
  },
  {
    id: "stroop",
    title: "Color clash",
    skill: "Cognitive flexibility",
    category: "Flexibility",
    description: "Trust the ink, not the word. A tiny twist for a sharper mind.",
    duration: "1 min",
    difficulty: "Quick thinking",
    icon: "zap",
    tone: "lilac",
    instruction: "The word and its ink color may agree—or try to trick you. Decide whether they match before the next card arrives.",
    howTo: "Read the ink color · Tap yes if word and ink match · Keep your streak alive",
  },
  {
    id: "memory",
    title: "Pattern keeper",
    skill: "Working memory",
    category: "Memory",
    description: "Watch a pattern light up, then replay it from memory.",
    duration: "1 min",
    difficulty: "Find your rhythm",
    icon: "brain",
    tone: "mint",
    instruction: "A sequence of tiles will light up. Take a mental snapshot, then tap the pattern back in the same order.",
    howTo: "Watch the sequence · Tap each tile in order · One clean run earns a perfect score",
  },
  {
    id: "speed",
    title: "Quick match",
    skill: "Processing speed",
    category: "Speed",
    description: "Find the matching symbols before your focus drifts away.",
    duration: "1 min",
    difficulty: "Beat the clock",
    icon: "sparkle",
    tone: "blue",
    instruction: "Find all three copies of the target symbol in each grid. Skip the lookalikes and see how many boards you can clear.",
    howTo: "Look at the target · Tap its three matches · Move on as soon as you clear a board",
  },
];

const STROOP_COLORS: StroopColor[] = [
  { label: "BLUE", hex: "#4d79db" },
  { label: "CORAL", hex: "#ed7767" },
  { label: "GREEN", hex: "#42aa85" },
  { label: "VIOLET", hex: "#9770d8" },
  { label: "GOLD", hex: "#d59b34" },
];

const NAV_ITEMS: { id: Section; label: string; icon: IconName }[] = [
  { id: "home", label: "Today", icon: "home" },
  { id: "games", label: "Explore games", icon: "grid" },
  { id: "progress", label: "My progress", icon: "chart" },
  { id: "leaderboard", label: "Leaderboard", icon: "trophy" },
];

const DEFAULT_PROFILE: LearnerProfile = {
  id: "",
  displayName: "Mindical learner",
  xp: 0,
  streak: 0,
  lastPlayedAt: null,
};

function Icon({
  name,
  size = 18,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "home":
      return <svg {...shared}><path d="m3.5 10.5 8.5-7 8.5 7" /><path d="M5.5 9.5v10h13v-10M9 19.5v-6h6v6" /></svg>;
    case "grid":
      return <svg {...shared}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></svg>;
    case "chart":
      return <svg {...shared}><path d="M4 19.5h16" /><path d="M7 16v-4M12 16V6M17 16V9" /><path d="m5.5 9 5-4 4.5 2 4-4" /></svg>;
    case "trophy":
      return <svg {...shared}><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v4M8 20h8M9.5 17h5" /></svg>;
    case "sparkle":
      return <svg {...shared}><path d="m12 3 1.6 6.4L20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></svg>;
    case "clock":
      return <svg {...shared}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></svg>;
    case "arrow":
      return <svg {...shared}><path d="M4.5 12h14M13 5.5l6.5 6.5-6.5 6.5" /></svg>;
    case "chevron":
      return <svg {...shared}><path d="m9 18 6-6-6-6" /></svg>;
    case "flame":
      return <svg {...shared}><path d="M12 21a7 7 0 0 0 7-7c0-4.2-4-5.7-4-10-2.7 2-4 4.4-4 7-1.5-.9-2-2.5-2-4-2.3 2-4 4.2-4 7a7 7 0 0 0 7 7Z" /><path d="M12 21a3.5 3.5 0 0 0 3.5-3.5c0-1.8-1.5-2.6-2.3-4.1-1.4 1-2.7 2.5-2.7 4.1A3.5 3.5 0 0 0 12 21Z" /></svg>;
    case "target":
      return <svg {...shared}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></svg>;
    case "zap":
      return <svg {...shared}><path d="m13.5 2.8-8 10h6l-1 8.4 8-10h-6l1-8.4Z" /></svg>;
    case "brain":
      return <svg {...shared}><path d="M12 5.2a3.5 3.5 0 0 0-6.7 1.2 3.4 3.4 0 0 0-1.1 6 3.7 3.7 0 0 0 2.7 6.1A3.6 3.6 0 0 0 12 20V5.2Z" /><path d="M12 5.2a3.5 3.5 0 0 1 6.7 1.2 3.4 3.4 0 0 1 1.1 6 3.7 3.7 0 0 1-2.7 6.1A3.6 3.6 0 0 1 12 20V5.2Z" /><path d="M7.5 9.5c1.5 0 2.2.8 2.2 2M16.5 9.5c-1.5 0-2.2.8-2.2 2M8.5 15c1.3 0 2 .6 2 1.7M15.5 15c-1.3 0-2 .6-2 1.7" /></svg>;
    case "bars":
      return <svg {...shared}><path d="M4.5 19.5v-7M9.5 19.5v-12M14.5 19.5v-9M19.5 19.5v-15" /></svg>;
    case "check":
      return <svg {...shared}><path d="m5 12.5 4.2 4L19 7" /></svg>;
    case "close":
      return <svg {...shared}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "user":
      return <svg {...shared}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>;
    case "play":
      return <svg {...shared}><path d="m8.5 5.5 10 6.5-10 6.5v-13Z" fill="currentColor" stroke="none" /></svg>;
    case "award":
      return <svg {...shared}><circle cx="12" cy="8.5" r="5" /><path d="m8.5 13-1 8 4.5-2.5 4.5 2.5-1-8" /><path d="m10 8.5 1.3 1.3L14.5 7" /></svg>;
    case "calendar":
      return <svg {...shared}><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><path d="M8 3.5v4M16 3.5v4M4 10h16" /></svg>;
    case "menu":
      return <svg {...shared}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
  }
}

const DROP_COLORS: { id: DropColorId; label: string; hex: string }[] = [
  { id: "orange", label: "Orange", hex: "#db8a6a" },
  { id: "yellow", label: "Yellow", hex: "#e8d34b" },
  { id: "mint", label: "Mint", hex: "#40ecb2" },
  { id: "sky", label: "Sky", hex: "#8fb9e3" },
  { id: "navy", label: "Navy", hex: "#25399a" },
  { id: "purple", label: "Purple", hex: "#ba44ef" },
  { id: "pink", label: "Pink", hex: "#e9459d" },
];
const DROP_TIMES = [30, 50, 70, 90];
const DROP_LANES = [6, 25, 44, 63, 82];
const DROP_POOL = 14;
const DROP_SLOW_RATE = 0.5;
const DROP_SLOW_MS = 4000;
const DROP_SLOW_USES = 2;
const DROP_LEVEL_KEY = "mindical-drop-level";

function dropSettings(level: number) {
  return {
    fall: Math.max(0.8, 1.8 - 0.15 * (level - 1)),
    gap: Math.max(0.45, 0.7 - 0.04 * (level - 1)),
  };
}

function pickFocusColor(previous: DropColorId | null): DropColorId {
  const choices = DROP_COLORS.filter((color) => color.id !== previous);
  return choices[Math.floor(Math.random() * choices.length)].id;
}

function readStoredLevel(): number {
  try {
    const stored = Number.parseInt(window.localStorage.getItem(DROP_LEVEL_KEY) ?? "1", 10);
    return Number.isFinite(stored) && stored >= 1 ? Math.min(stored, 99) : 1;
  } catch {
    return 1;
  }
}

function makeDropPlan(duration: number, level: number, focusId: DropColorId): DropPlan {
  const { fall, gap } = dropSettings(level);
  const starts: number[] = [];
  const lastStart = duration - fall - 0.4;
  for (let at = 0.4; at <= lastStart; at += gap * (0.85 + Math.random() * 0.3)) {
    starts.push(at);
  }

  const total = starts.length;
  const targetCount = Math.max(4, Math.round(total * (0.2 + Math.random() * 0.08)));
  const targetIds = new Set<number>();
  while (targetIds.size < targetCount) {
    targetIds.add(Math.floor(Math.random() * total));
  }

  const focus = DROP_COLORS.find((color) => color.id === focusId) ?? DROP_COLORS[0];
  const others = DROP_COLORS.filter((color) => color.id !== focus.id);
  let lastLane = -1;

  const balls = starts.map((start, id): DropBall => {
    let lane = Math.floor(Math.random() * DROP_LANES.length);
    if (lane === lastLane) {
      lane = (lane + 1 + Math.floor(Math.random() * (DROP_LANES.length - 1))) % DROP_LANES.length;
    }
    lastLane = lane;
    const target = targetIds.has(id);
    return {
      id,
      start,
      x: DROP_LANES[lane] + Math.random() * 6 - 3,
      size: 26 + Math.random() * 8,
      hex: target ? focus.hex : others[Math.floor(Math.random() * others.length)].hex,
      target,
    };
  });

  return { balls, fall, targetCount };
}

type DropEngineOptions = {
  plan: DropPlan;
  duration: number;
  fieldHeight: number;
  nodes: HTMLSpanElement[];
  startedAt: number;
  getSlowUntil: () => number;
  onSecond: (secondsLeft: number) => void;
  onSlowChange: (active: boolean) => void;
};

// Runs the falling balls. "world" is game time: it runs at full speed normally and at
// half speed while Slow down is active, so a slowed game simply lasts longer.
function createDropEngine(options: DropEngineOptions) {
  const { plan, duration, fieldHeight, nodes, getSlowUntil, onSecond, onSlowChange } = options;
  const free = [...nodes];
  const flying: Array<{ ball: DropBall; node: HTMLSpanElement }> = [];
  let nextBall = 0;
  let world = 0;
  let lastWhole = 0;
  let lastTime = options.startedAt;
  let wasSlow = false;

  return (now: number): boolean => {
    const isSlow = now < getSlowUntil();
    if (isSlow !== wasSlow) {
      wasSlow = isSlow;
      onSlowChange(isSlow);
    }
    world += Math.min(0.1, Math.max(0, now - lastTime) / 1000) * (isSlow ? DROP_SLOW_RATE : 1);
    lastTime = now;

    while (nextBall < plan.balls.length && plan.balls[nextBall].start <= world && free.length > 0) {
      const ball = plan.balls[nextBall];
      const node = free.pop() as HTMLSpanElement;
      node.style.left = `${ball.x}%`;
      node.style.width = `${ball.size}px`;
      node.style.height = `${ball.size}px`;
      node.style.background = ball.hex;
      node.style.opacity = "1";
      flying.push({ ball, node });
      nextBall += 1;
    }

    for (let index = flying.length - 1; index >= 0; index -= 1) {
      const { ball, node } = flying[index];
      const progress = (world - ball.start) / plan.fall;
      if (progress >= 1) {
        node.style.opacity = "0";
        free.push(node);
        flying.splice(index, 1);
      } else {
        node.style.transform = `translate3d(0, ${-ball.size + progress * (fieldHeight + ball.size)}px, 0)`;
      }
    }

    const whole = Math.floor(world);
    if (whole !== lastWhole) {
      lastWhole = whole;
      onSecond(Math.max(0, duration - whole));
    }
    if (world >= duration) {
      onSecond(0);
      return true;
    }
    return false;
  };
}

function makeStroopQuestion(): StroopQuestion {
  const wordIndex = Math.floor(Math.random() * STROOP_COLORS.length);
  let inkIndex = Math.floor(Math.random() * STROOP_COLORS.length);
  if (Math.random() > 0.48) {
    inkIndex = wordIndex;
  } else if (inkIndex === wordIndex) {
    inkIndex = (inkIndex + 1 + Math.floor(Math.random() * (STROOP_COLORS.length - 1))) % STROOP_COLORS.length;
  }

  return {
    word: STROOP_COLORS[wordIndex],
    ink: STROOP_COLORS[inkIndex],
    matches: wordIndex === inkIndex,
  };
}

function makeMemorySequence() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 9));
}

function makeSpeedBoard(): SpeedBoard {
  const symbols = ["●", "◆", "✦", "▲", "■", "✚"];
  const target = symbols[Math.floor(Math.random() * symbols.length)];
  const decoys = symbols.filter((symbol) => symbol !== target);
  const tiles = [target, target, target, ...Array.from({ length: 9 }, () => decoys[Math.floor(Math.random() * decoys.length)])];

  for (let index = tiles.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [tiles[index], tiles[swapIndex]] = [tiles[swapIndex], tiles[index]];
  }

  return { target, tiles };
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "M";
}

function displayGameName(mode: string) {
  return GAMES.find((game) => game.id === mode)?.title ?? "Training game";
}

function dayLabel(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

export default function MindicalApp({ initialProfile }: { initialProfile?: LearnerProfile }) {
  const [section, setSection] = useState<Section>("home");
  const [profile, setProfile] = useState<LearnerProfile>(initialProfile ?? DEFAULT_PROFILE);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncOffline, setSyncOffline] = useState(false);
  const [activeGame, setActiveGame] = useState<GameMode | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [toast, setToast] = useState("");
  const [todayLabel, setTodayLabel] = useState("A little time for you");
  const [weekdayIndex, setWeekdayIndex] = useState(0);
  const [gameFilter, setGameFilter] = useState("All skills");

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Dashboard request failed");
      const payload = (await response.json()) as DashboardPayload;
      setProfile(payload.profile);
      setSessions(payload.sessions);
      setLeaderboard(payload.leaderboard);
      setSyncOffline(false);
    } catch {
      setSyncOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTodayLabel(
      new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    );
    setWeekdayIndex((new Date().getDay() + 6) % 7);
    void loadDashboard();
  }, [loadDashboard]);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }, []);

  const firstName = profile.displayName.trim().split(/\s+/)[0] || "friend";
  const totalSessions = sessions.length;
  const averageAccuracy = totalSessions
    ? Math.round(sessions.reduce((sum, session) => sum + session.accuracy, 0) / totalSessions)
    : 0;
  const minutesPracticed = Math.round(
    sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60,
  );
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
  const activeStreakDays = new Set(
    Array.from({ length: Math.min(profile.streak, 7) }, (_, index) => (weekdayIndex - index + 7) % 7),
  );

  const handleSessionComplete = useCallback(
    async (result: RunResult) => {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!response.ok) throw new Error("Could not sync this session.");
      const payload = (await response.json()) as { profile: LearnerProfile; xpEarned: number };
      setProfile(payload.profile);
      await loadDashboard();
      return payload.xpEarned;
    },
    [loadDashboard],
  );

  const openProfile = () => {
    setNameDraft(profile.displayName);
    setProfileOpen(true);
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
    } finally {
      window.location.reload();
    }
  };

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const displayName = cleanUsername(nameDraft);
    const problem = validateUsername(displayName);
    if (problem) {
      notify(problem);
      return;
    }

    setSavingName(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const payload = (await response.json().catch(() => null)) as { profile?: LearnerProfile; error?: string } | null;
      if (!response.ok || !payload?.profile) throw new Error(payload?.error ?? "Could not update your profile.");
      setProfile(payload.profile);
      setProfileOpen(false);
      notify("Your profile is looking good.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "We couldn't save that username. Try again in a moment.");
    } finally {
      setSavingName(false);
    }
  };

  const visibleGames = useMemo(
    () =>
      gameFilter === "All skills"
        ? GAMES
        : GAMES.filter((game) => game.category === gameFilter),
    [gameFilter],
  );

  const navTo = (target: Section) => {
    setSection(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const savedGame = (mode: string) => sessions.find((session) => session.mode === mode);

  return (
    <div className="mindical-app">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => navTo("home")} aria-label="Mindical home">
            <span className="brand-mark"><Icon name="brain" size={22} strokeWidth={2.1} /></span>
            <span className="brand-word">mindical<span>.</span></span>
          </button>

          <nav className="top-nav" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <button
                className={`top-nav-link ${section === item.id ? "is-active" : ""}`}
                key={item.id}
                onClick={() => navTo(item.id)}
              >
                {item.label === "Explore games" ? "Games" : item.label === "My progress" ? "Progress" : item.label === "Leaderboard" ? "Rankings" : item.label}
              </button>
            ))}
          </nav>

          <div className="topbar-tools">
            <div className="top-streak"><Icon name="flame" size={17} /><span>{profile.streak} day streak</span></div>
            <button className="profile-trigger" onClick={openProfile} aria-label="Edit learner profile">
              <span className="avatar">{initials(profile.displayName)}</span>
              <span className="profile-trigger-name">{profile.displayName}</span>
              <Icon name="chevron" size={15} />
            </button>
          </div>
        </div>
      </header>

      <div className="app-layout">
        <aside className="left-sidebar">
          <div className="sidebar-label">YOUR SPACE</div>
          <nav className="side-nav" aria-label="Your Mindical">
            {NAV_ITEMS.map((item) => (
              <button
                className={`side-nav-link ${section === item.id ? "is-active" : ""}`}
                key={item.id}
                onClick={() => navTo(item.id)}
                aria-current={section === item.id ? "page" : undefined}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
                {section === item.id && <span className="nav-active-dot" />}
              </button>
            ))}
          </nav>

          <div className="sidebar-plan-card">
            <span className="plan-sparkle"><Icon name="sparkle" size={17} /></span>
            <p className="plan-card-title">A little goes a long way.</p>
            <p className="plan-card-copy">A few focused minutes can make today feel different.</p>
            <button className="text-link" onClick={() => setActiveGame("memory")}>
              Try a quick game <Icon name="arrow" size={14} />
            </button>
          </div>

          <div className="sidebar-footer">
            <span className={`sync-indicator ${syncOffline ? "is-offline" : ""}`} />
            <span>{syncOffline ? "Progress saved locally" : "Your progress is synced"}</span>
          </div>
        </aside>

        <main className="main-content">
          {section === "home" && (
            <>
              <div className="welcome-block">
                <div className="eyebrow"><span className="eyebrow-dot" /> YOUR DAILY RESET <span className="eyebrow-date">{todayLabel}</span></div>
                <h1>Good to see you, {firstName}<span className="hello-spark">✳</span></h1>
                <p>A few playful minutes for a clearer, calmer kind of focus.</p>
              </div>

              <section className="featured-card" aria-labelledby="featured-heading">
                <div className="featured-copy">
                  <div className="featured-label"><Icon name="sparkle" size={14} /> TODAY&apos;S PICK <span>·</span> 2 MIN</div>
                  <h2 id="featured-heading">Give your attention<br />a little room to grow.</h2>
                  <p>Follow the moving field, find your focus, and finish on a high note.</p>
                  <button className="primary-button featured-button" onClick={() => setActiveGame("tracking")}>
                    Play Orbit count <Icon name="arrow" size={17} />
                  </button>
                  <div className="featured-footnote"><span className="tiny-check"><Icon name="check" size={12} /></span> No setup. Just you and a quick brain break.</div>
                </div>
                <div className="featured-art" aria-hidden="true">
                  <div className="art-halo art-halo-one" />
                  <div className="art-halo art-halo-two" />
                  <div className="art-orbit art-orbit-one"><i /><i /><i /></div>
                  <div className="art-orbit art-orbit-two"><i /><i /></div>
                  <div className="art-brain"><Icon name="brain" size={86} strokeWidth={1.2} /></div>
                  <div className="art-note note-focus"><span className="note-dot coral-dot" /> focus</div>
                  <div className="art-note note-flow"><span className="note-dot mint-dot" /> flow state</div>
                  <div className="art-stars"><span>✦</span><span>·</span><span>✧</span></div>
                </div>
                <div className="featured-number"><strong>01</strong><span>/ 04</span></div>
              </section>

              <div className="section-title-row">
                <div>
                  <div className="section-kicker">YOUR TRAINING DECK</div>
                  <h2>Pick a brain boost</h2>
                </div>
                <button className="subtle-link" onClick={() => navTo("games")}>All games <Icon name="arrow" size={15} /></button>
              </div>

              <div className="game-grid home-game-grid">
                {GAMES.map((game, index) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    index={index}
                    latest={savedGame(game.id)}
                    onClick={() => setActiveGame(game.id)}
                  />
                ))}
              </div>

              <section className="home-bottom-row">
                <div className="week-summary-card">
                  <div className="summary-heading">
                    <div><span className="section-kicker">YOUR MOMENTUM</span><h3>Steady looks good on you.</h3></div>
                    <button className="round-link" onClick={() => navTo("progress")} aria-label="View all progress"><Icon name="arrow" size={16} /></button>
                  </div>
                  <div className="summary-stats">
                    <div><strong>{totalSessions}</strong><span>sessions played</span></div>
                    <div><strong>{averageAccuracy}<small>%</small></strong><span>average accuracy</span></div>
                    <div><strong>{minutesPracticed}<small>m</small></strong><span>time well spent</span></div>
                  </div>
                </div>
                <div className="tiny-quote-card">
                  <div className="quote-mark">“</div>
                  <p>Show up curious.<br /><strong>Leave a little sharper.</strong></p>
                  <span>THE MINDICAL WAY</span>
                </div>
              </section>
            </>
          )}

          {section === "games" && (
            <section className="page-view">
              <div className="page-heading-row">
                <div>
                  <div className="eyebrow"><span className="eyebrow-dot" /> THE GAME ROOM</div>
                  <h1>Choose your kind of focus.</h1>
                  <p>Short, thoughtful challenges. Pick a skill and see where it takes you.</p>
                </div>
                <div className="game-count-badge"><span>04</span> games to explore</div>
              </div>
              <div className="filter-row" aria-label="Filter games">
                {["All skills", "Attention", "Flexibility", "Memory", "Speed"].map((filter) => (
                  <button
                    className={`filter-chip ${gameFilter === filter ? "is-selected" : ""}`}
                    key={filter}
                    onClick={() => setGameFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="game-grid library-game-grid">
                {visibleGames.map((game, index) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    index={index}
                    latest={savedGame(game.id)}
                    onClick={() => setActiveGame(game.id)}
                    library
                  />
                ))}
              </div>
              <div className="library-note"><Icon name="brain" size={20} /><span>Each exercise is a small invitation to notice, practice, and come back tomorrow.</span></div>
            </section>
          )}

          {section === "progress" && (
            <section className="page-view">
              <div className="page-heading-row progress-heading">
                <div>
                  <div className="eyebrow"><span className="eyebrow-dot" /> YOUR PERSONAL SNAPSHOT</div>
                  <h1>Look how far you&apos;ve come.</h1>
                  <p>Progress isn&apos;t a race. These little wins are all yours.</p>
                </div>
                <div className="xp-total-card"><span className="xp-star"><Icon name="sparkle" size={18} /></span><div><strong>{profile.xp.toLocaleString()}</strong><span>total XP earned</span></div></div>
              </div>

              <div className="progress-metrics">
                <MetricCard icon="play" label="Sessions" value={totalSessions.toString()} note="Every one counts" tone="coral" />
                <MetricCard icon="target" label="Average accuracy" value={`${averageAccuracy}%`} note="Your focus, measured" tone="mint" />
                <MetricCard icon="flame" label="Current streak" value={`${profile.streak} days`} note="Keep the good thing going" tone="peach" />
                <MetricCard icon="clock" label="Time practiced" value={`${minutesPracticed} min`} note="A mindful investment" tone="lilac" />
              </div>

              <div className="progress-panels">
                <section className="panel-card activity-panel">
                  <div className="panel-heading"><div><span className="section-kicker">THE LAST 7 DAYS</span><h2>Little steps add up.</h2></div><span className="panel-icon"><Icon name="calendar" size={18} /></span></div>
                  <ActivityChart sessions={sessions} />
                  <div className="chart-caption"><span><i className="chart-key" /> Sessions played</span><span>Recent activity</span></div>
                </section>
                <section className="panel-card skill-panel">
                  <div className="panel-heading"><div><span className="section-kicker">SKILL MIX</span><h2>A little bit of everything.</h2></div><span className="panel-icon mint-panel-icon"><Icon name="brain" size={18} /></span></div>
                  <div className="skill-breakdown">
                    {GAMES.map((game) => {
                      const count = sessions.filter((session) => session.mode === game.id).length;
                      const percent = totalSessions ? Math.round((count / totalSessions) * 100) : 0;
                      return <div className="skill-row" key={game.id}><div className={`skill-mini-icon tone-${game.tone}`}><Icon name={game.icon} size={14} /></div><div className="skill-row-main"><div className="skill-row-label"><span>{game.skill}</span><strong>{count}</strong></div><div className="skill-track"><span className={`skill-fill fill-${game.tone}`} style={{ width: `${percent}%` }} /></div></div></div>;
                    })}
                  </div>
                  <button className="text-link skill-link" onClick={() => navTo("games")}>Explore another skill <Icon name="arrow" size={14} /></button>
                </section>
              </div>

              <section className="panel-card recent-panel">
                <div className="panel-heading"><div><span className="section-kicker">YOUR TRAINING LOG</span><h2>Recent sessions</h2></div><span className="quiet-label">{sessions.length} latest</span></div>
                {sessions.length ? (
                  <div className="recent-table">
                    {sessions.slice(0, 6).map((session) => {
                      const game = GAMES.find((item) => item.id === session.mode);
                      return <div className="recent-row" key={session.id}><div className={`recent-game-icon tone-${game?.tone ?? "coral"}`}><Icon name={game?.icon ?? "brain"} size={17} /></div><div className="recent-game-name"><strong>{displayGameName(session.mode)}</strong><span>{dayLabel(session.createdAt)}</span></div><span className="recent-accuracy">{session.accuracy}% <small>accuracy</small></span><span className="recent-score">{session.score.toLocaleString()} <small>pts</small></span><span className="recent-xp">+{session.xpEarned} XP</span></div>;
                    })}
                  </div>
                ) : <EmptyState icon="chart" title="Your story starts with one session." copy="Play a quick game and your progress will show up here." onAction={() => navTo("games")} action="Find a game" />}
              </section>

              <section className="achievement-section">
                <div className="section-title-row"><div><div className="section-kicker">MILESTONES</div><h2>Small wins worth keeping.</h2></div></div>
                <div className="achievement-grid">
                  <AchievementCard title="First steps" description="Play your first training game." icon="play" unlocked={totalSessions >= 1} />
                  <AchievementCard title="Clear thinker" description="Reach 90% accuracy in a game." icon="target" unlocked={sessions.some((session) => session.accuracy >= 90)} />
                  <AchievementCard title="Making a habit" description="Build a three-day streak." icon="flame" unlocked={profile.streak >= 3} />
                  <AchievementCard title="Curious mind" description="Try all four training skills." icon="sparkle" unlocked={new Set(sessions.map((session) => session.mode)).size >= 4} />
                </div>
              </section>
            </section>
          )}

          {section === "leaderboard" && (
            <section className="page-view leaderboard-view">
              <div className="page-heading-row">
                <div>
                  <div className="eyebrow"><span className="eyebrow-dot" /> FRIENDLY COMPETITION</div>
                  <h1>Good minds, good company.</h1>
                  <p>Everyone here is just showing up for a little practice. That counts.</p>
                </div>
                <div className="leaderboard-trophy"><Icon name="trophy" size={28} /></div>
              </div>
              <div className="leaderboard-card">
                <div className="leaderboard-card-heading"><div><span className="section-kicker">ALL-TIME MINDICAL COMMUNITY</span><h2>The XP club</h2></div><span className="leaderboard-live"><i /> LIVE RANKINGS</span></div>
                {leaderboard.length ? (
                  <div className="leaderboard-list">
                    {leaderboard.map((entry, index) => {
                      const isMe = entry.id === profile.id;
                      return <div className={`leaderboard-row ${isMe ? "is-me" : ""}`} key={entry.id}><span className={`leader-rank rank-${index + 1}`}>{index < 3 ? ["✦", "✧", "✦"][index] : String(index + 1).padStart(2, "0")}</span><span className={`leader-avatar leader-avatar-${index % 4}`}>{initials(entry.displayName)}</span><span className="leader-name"><strong>{entry.displayName}{isMe && <em>YOU</em>}</strong><small>{entry.streak} day streak</small></span><span className="leader-xp"><strong>{entry.xp.toLocaleString()}</strong><small>XP</small></span></div>;
                    })}
                  </div>
                ) : <EmptyState icon="trophy" title="Your name could be first." copy="Play a game to earn your first XP and join the board." onAction={() => navTo("games")} action="Play a game" />}
                <div className="leaderboard-footnote"><Icon name="sparkle" size={15} /> Just a friendly nudge. Your progress is your own.</div>
              </div>
              <div className="leaderboard-side-note"><div className="note-icon"><Icon name="award" size={22} /></div><div><strong>Every practice is a win.</strong><span>Scores help us celebrate your effort—not define your ability.</span></div></div>
            </section>
          )}
        </main>

        <aside className="right-rail">
          <div className="rail-heading"><span>YOUR LITTLE WINS</span><button onClick={() => navTo("progress")} aria-label="View progress"><Icon name="arrow" size={15} /></button></div>

          <section className="streak-widget">
            <div className="streak-topline"><div className="streak-flame"><Icon name="flame" size={19} /></div><span className="streak-caption">DAILY STREAK</span><span className="streak-more">···</span></div>
            <div className="streak-number">{profile.streak}<span> {profile.streak === 1 ? "day" : "days"}</span></div>
            <p>{profile.streak > 0 ? "You showed up. That’s the secret." : "One short game is all it takes."}</p>
            <div className="week-dots" aria-label={`${profile.streak} day streak this week`}>
              {weekDays.map((day, index) => <div className="week-day" key={`${day}-${index}`}><span className={activeStreakDays.has(index) ? "is-done" : index === weekdayIndex ? "is-today" : ""}>{activeStreakDays.has(index) ? <Icon name="check" size={12} /> : ""}</span><small>{day}</small></div>)}
            </div>
            <div className="streak-encouragement"><span>✦</span> Come back tomorrow to keep it glowing</div>
          </section>

          <section className="weekly-goal-card">
            <div className="goal-heading"><span className="goal-icon"><Icon name="target" size={17} /></span><span>THIS WEEK&apos;S GOAL</span></div>
            <div className="goal-main"><strong>{Math.min(totalSessions, 5)}<small>/ 5</small></strong><span>sessions</span></div>
            <div className="goal-progress"><span style={{ width: `${Math.min(totalSessions / 5, 1) * 100}%` }} /></div>
            <p>{totalSessions >= 5 ? "You reached your weekly goal. Lovely work!" : `${5 - Math.min(totalSessions, 5)} more ${5 - Math.min(totalSessions, 5) === 1 ? "session" : "sessions"} to hit your goal.`}</p>
          </section>

          <section className="mini-leaderboard">
            <div className="mini-heading"><div><span className="section-kicker">GOOD COMPANY</span><h3>Top learners</h3></div><button onClick={() => navTo("leaderboard")} aria-label="View leaderboard"><Icon name="arrow" size={15} /></button></div>
            {leaderboard.length ? leaderboard.slice(0, 3).map((entry, index) => <div className="mini-leader-row" key={entry.id}><span className="mini-place">{String(index + 1).padStart(2, "0")}</span><span className={`mini-avatar mini-avatar-${index}`}>{initials(entry.displayName)}</span><span className="mini-name">{entry.displayName}{entry.id === profile.id && <i>YOU</i>}</span><strong>{entry.xp.toLocaleString()}</strong></div>) : <p className="mini-empty">A little friendly inspiration goes a long way.</p>}
            <button className="mini-view-all" onClick={() => navTo("leaderboard")}>See the leaderboard <Icon name="arrow" size={13} /></button>
          </section>

          <div className="rail-quote"><span className="quote-stars">✳ ✦</span><p>Brains love<br /><strong>a little play.</strong></p><span className="quote-signature">— YOUR MINDICAL TEAM</span></div>
        </aside>
      </div>

      <footer className="site-footer"><span>mindical<span className="footer-dot">.</span> <small>MAKE A LITTLE ROOM TO THINK.</small></span><span>{loading ? "Connecting your progress…" : syncOffline ? "Your games still work offline." : "Progress stays with this browser profile."}</span></footer>

      {activeGame && <GameOverlay mode={activeGame} onClose={() => setActiveGame(null)} onComplete={handleSessionComplete} />}

      {profileOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfileOpen(false); }}>
          <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
            <button className="modal-close" onClick={() => setProfileOpen(false)} aria-label="Close profile dialog"><Icon name="close" size={19} /></button>
            <div className="modal-avatar">{initials(profile.displayName)}</div>
            <div className="eyebrow modal-eyebrow"><span className="eyebrow-dot" /> YOUR MINDICAL PROFILE</div>
            <h2 id="profile-title">Make yourself at home.</h2>
            <p>Your progress is saved to your account. Choose the username other players will see.</p>
            <form className="profile-form" onSubmit={saveName}>
              <label htmlFor="display-name">Username</label>
              <input id="display-name" autoFocus maxLength={20} autoCapitalize="none" spellCheck={false} value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} placeholder="Your username" />
              <div className="profile-form-actions"><button type="button" className="secondary-button" onClick={() => setProfileOpen(false)}>Not now</button><button type="submit" className="primary-button" disabled={savingName || !nameDraft.trim()}>{savingName ? "Saving…" : "Save username"}</button></div>
            </form>
            <div className="privacy-note"><Icon name="check" size={14} /> Your progress is stored securely with your account.</div>
            <button type="button" className="secondary-button signout-button" onClick={signOut}>Sign out</button>
          </section>
        </div>
      )}

      {toast && <div className="toast-message" role="status"><span><Icon name="check" size={15} /></span>{toast}</div>}
    </div>
  );
}

function GameCard({
  game,
  index,
  latest,
  onClick,
  library = false,
}: {
  game: GameInfo;
  index: number;
  latest?: SavedSession;
  onClick: () => void;
  library?: boolean;
}) {
  return (
    <button className={`game-card game-card-${game.tone} ${library ? "is-library-card" : ""}`} onClick={onClick} style={{ "--card-index": index } as CSSProperties}>
      <div className="game-card-top"><span className={`game-icon tone-${game.tone}`}><Icon name={game.icon} size={21} /></span><span className="game-difficulty">{game.difficulty}</span></div>
      <span className="game-category">{game.category.toUpperCase()}</span>
      <h3>{game.title}</h3>
      <p>{game.description}</p>
      {library && <div className="library-game-extra"><span className="game-skill-label"><Icon name="brain" size={13} /> {game.skill}</span><span>{latest ? `Best ${latest.score.toLocaleString()} pts` : "Ready when you are"}</span></div>}
      {!library && latest && <div className="last-score"><Icon name="award" size={14} /> Latest {latest.accuracy}% accuracy</div>}
      <div className="game-card-bottom"><span><Icon name="clock" size={14} /> {game.duration}</span><span className="game-card-arrow"><Icon name="arrow" size={16} /></span></div>
    </button>
  );
}

function MetricCard({ icon, label, value, note, tone }: { icon: IconName; label: string; value: string; note: string; tone: string }) {
  return <div className="metric-card"><span className={`metric-icon metric-${tone}`}><Icon name={icon} size={18} /></span><span className="metric-label">{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function ActivityChart({ sessions }: { sessions: SavedSession[] }) {
  const days = useMemo(() => {
    const today = new Date();
    const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(midnight);
      date.setDate(midnight.getDate() - (6 - index));
      const count = sessions.filter((session) => {
        const created = new Date(session.createdAt);
        return created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth() && created.getDate() === date.getDate();
      }).length;
      return { label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date).slice(0, 1), count };
    });
  }, [sessions]);
  const max = Math.max(2, ...days.map((day) => day.count));

  return <div className="activity-chart" aria-label="Sessions in the last seven days">
    {days.map((day, index) => <div className="chart-column" key={`${day.label}-${index}`}><span className="chart-count">{day.count || ""}</span><div className="chart-bar-track"><span className={`chart-bar ${index === days.length - 1 ? "is-today" : ""}`} style={{ height: `${Math.max(day.count ? 18 : 8, (day.count / max) * 100)}%` }} /></div><small>{day.label}</small></div>)}
  </div>;
}

function AchievementCard({ title, description, icon, unlocked }: { title: string; description: string; icon: IconName; unlocked: boolean }) {
  return <div className={`achievement-card ${unlocked ? "is-unlocked" : "is-locked"}`}><span className="achievement-icon"><Icon name={icon} size={20} /></span><div><strong>{title}</strong><p>{description}</p></div><span className="achievement-status">{unlocked ? <Icon name="check" size={15} /> : "· · ·"}</span></div>;
}

function EmptyState({ icon, title, copy, action, onAction }: { icon: IconName; title: string; copy: string; action: string; onAction: () => void }) {
  return <div className="empty-state"><span className="empty-state-icon"><Icon name={icon} size={24} /></span><strong>{title}</strong><p>{copy}</p><button className="text-link" onClick={onAction}>{action} <Icon name="arrow" size={14} /></button></div>;
}

function GameOverlay({
  mode,
  onClose,
  onComplete,
}: {
  mode: GameMode;
  onClose: () => void;
  onComplete: (result: RunResult) => Promise<number>;
}) {
  const game = GAMES.find((item) => item.id === mode) ?? GAMES[0];
  const [trackingTime, setTrackingTime] = useState<number>(DROP_TIMES[0]);
  const duration = mode === "tracking" ? trackingTime : mode === "memory" ? 24 : 20;
  const [phase, setPhase] = useState<"ready" | "playing" | "answer" | "complete">("ready");
  const [seconds, setSeconds] = useState(duration);
  const [dropPlan, setDropPlan] = useState<DropPlan | null>(null);
  const [dropLevel, setDropLevel] = useState<number>(() => readStoredLevel());
  const [focusId, setFocusId] = useState<DropColorId>(() => pickFocusColor(null));
  const [slowLeft, setSlowLeft] = useState(DROP_SLOW_USES);
  const [slowActive, setSlowActive] = useState(false);
  const [dropOutcome, setDropOutcome] = useState<{ guess: number; actual: number; correct: boolean } | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const poolRef = useRef<Array<HTMLSpanElement | null>>([]);
  const slowUntilRef = useRef(0);
  const [trackingGuess, setTrackingGuess] = useState("");
  const [question, setQuestion] = useState<StroopQuestion | null>(null);
  const [feedback, setFeedback] = useState("");
  const [memorySequence, setMemorySequence] = useState<number[]>([]);
  const [memoryStage, setMemoryStage] = useState<"watch" | "recall" | "done">("watch");
  const [memoryInput, setMemoryInput] = useState<number[]>([]);
  const [activeTile, setActiveTile] = useState(-1);
  const [speedBoard, setSpeedBoard] = useState<SpeedBoard>({ target: "✦", tiles: [] });
  const [speedTapped, setSpeedTapped] = useState<number[]>([]);
  const [speedFound, setSpeedFound] = useState(0);
  const [summary, setSummary] = useState<RunResult | null>(null);
  const [saveState, setSaveState] = useState<"saving" | "saved" | "offline">("saving");
  const [xpAward, setXpAward] = useState<number | null>(null);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const currentStreakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const startedAtRef = useRef(0);
  const completedRef = useRef(false);

  const finishRun = useCallback((score: number, accuracy: number, bestStreak = bestStreakRef.current) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const elapsed = startedAtRef.current ? Math.round((Date.now() - startedAtRef.current) / 1000) : 1;
    const result: RunResult = {
      mode,
      score: Math.max(0, Math.round(score)),
      accuracy: Math.max(0, Math.min(100, Math.round(accuracy))),
      durationSeconds: Math.max(1, Math.min(180, elapsed)),
      bestStreak,
    };
    setSummary(result);
    setPhase("complete");
    setSaveState("saving");
    void onComplete(result)
      .then((earned) => {
        setXpAward(earned);
        setSaveState("saved");
      })
      .catch(() => setSaveState("offline"));
  }, [mode, onComplete]);

  const finishWithStats = useCallback(() => {
    const accuracy = mode === "memory"
      ? memorySequence.length ? Math.round((correctRef.current / memorySequence.length) * 100) : 0
      : totalRef.current ? Math.round((correctRef.current / totalRef.current) * 100) : 0;
    finishRun(scoreRef.current, accuracy);
  }, [finishRun, memorySequence.length, mode]);

  const beginGame = () => {
    scoreRef.current = 0;
    correctRef.current = 0;
    totalRef.current = 0;
    currentStreakRef.current = 0;
    bestStreakRef.current = 0;
    completedRef.current = false;
    startedAtRef.current = Date.now();
    setSeconds(duration);
    setSummary(null);
    setXpAward(null);
    setFeedback("");
    setMemoryInput([]);
    setSpeedTapped([]);
    setSpeedFound(0);

    if (mode === "tracking") {
      setDropPlan(makeDropPlan(duration, dropLevel, focusId));
      setSlowLeft(DROP_SLOW_USES);
      setSlowActive(false);
      slowUntilRef.current = 0;
      setDropOutcome(null);
      setTrackingGuess("");
    } else if (mode === "stroop") {
      setQuestion(makeStroopQuestion());
    } else if (mode === "memory") {
      setMemorySequence(makeMemorySequence());
      setMemoryStage("watch");
      setActiveTile(-1);
    } else {
      setSpeedBoard(makeSpeedBoard());
    }

    setPhase("playing");
  };

  useEffect(() => {
    if (phase !== "playing" || mode === "tracking") return;
    const interval = window.setInterval(() => setSeconds((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [mode, phase]);

  useEffect(() => {
    if (phase !== "playing" || mode !== "tracking" || !dropPlan) return;
    const field = fieldRef.current;
    if (!field) return;
    const nodes = poolRef.current.filter((node): node is HTMLSpanElement => node !== null);
    const tick = createDropEngine({
      plan: dropPlan,
      duration,
      fieldHeight: field.clientHeight,
      nodes,
      startedAt: performance.now(),
      getSlowUntil: () => slowUntilRef.current,
      onSecond: setSeconds,
      onSlowChange: setSlowActive,
    });
    let frame = 0;
    const loop = (now: number) => {
      if (!tick(now)) frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(frame);
      for (const node of nodes) node.style.opacity = "0";
    };
  }, [dropPlan, duration, mode, phase]);

  useEffect(() => {
    if (phase === "playing" && seconds === 0) {
      if (mode === "tracking") setPhase("answer");
      else finishWithStats();
    }
  }, [finishWithStats, mode, phase, seconds]);

  const answerStroop = useCallback((answer: boolean | null) => {
    if (phase !== "playing" || !question) return;
    const isCorrect = answer !== null && answer === question.matches;
    totalRef.current += 1;
    if (isCorrect) {
      correctRef.current += 1;
      currentStreakRef.current += 1;
      bestStreakRef.current = Math.max(bestStreakRef.current, currentStreakRef.current);
      scoreRef.current += 90 + Math.min(currentStreakRef.current, 6) * 15;
      setFeedback(currentStreakRef.current > 2 ? `${currentStreakRef.current} in a row!` : "Nicely spotted!");
    } else {
      currentStreakRef.current = 0;
      setFeedback(answer === null ? "Too slow — breathe and reset." : "Tricky one. Keep going!");
    }
    setQuestion(makeStroopQuestion());
    window.setTimeout(() => setFeedback(""), 500);
  }, [phase, question]);

  useEffect(() => {
    if (mode !== "stroop" || phase !== "playing" || !question) return;
    const timeout = window.setTimeout(() => answerStroop(null), 1900);
    return () => window.clearTimeout(timeout);
  }, [answerStroop, mode, phase, question]);

  useEffect(() => {
    if (mode !== "memory" || phase !== "playing" || memoryStage !== "watch" || memorySequence.length === 0) return;
    const timers: number[] = [];
    memorySequence.forEach((tile, index) => {
      const start = 350 + index * 720;
      timers.push(window.setTimeout(() => setActiveTile(tile), start));
      timers.push(window.setTimeout(() => setActiveTile(-1), start + 420));
    });
    timers.push(window.setTimeout(() => setMemoryStage("recall"), memorySequence.length * 720 + 450));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [memorySequence, memoryStage, mode, phase]);

  const chooseMemoryTile = (tile: number) => {
    if (phase !== "playing" || memoryStage !== "recall") return;
    const position = memoryInput.length;
    const correctChoice = memorySequence[position] === tile;
    totalRef.current += 1;

    if (!correctChoice) {
      setMemoryStage("done");
      setFeedback("That was a close one.");
      window.setTimeout(() => finishRun(scoreRef.current, Math.round((correctRef.current / memorySequence.length) * 100)), 480);
      return;
    }

    correctRef.current += 1;
    currentStreakRef.current += 1;
    bestStreakRef.current = Math.max(bestStreakRef.current, currentStreakRef.current);
    scoreRef.current += 115;
    const nextInput = [...memoryInput, tile];
    setMemoryInput(nextInput);

    if (nextInput.length === memorySequence.length) {
      setMemoryStage("done");
      setFeedback("Pattern perfectly kept!");
      window.setTimeout(() => finishRun(scoreRef.current, 100), 450);
    }
  };

  const chooseSpeedTile = (index: number) => {
    if (phase !== "playing" || speedTapped.includes(index)) return;
    const isTarget = speedBoard.tiles[index] === speedBoard.target;
    totalRef.current += 1;
    setSpeedTapped((current) => [...current, index]);

    if (!isTarget) {
      currentStreakRef.current = 0;
      setFeedback("Not that one — keep scanning.");
      window.setTimeout(() => setFeedback(""), 480);
      return;
    }

    correctRef.current += 1;
    currentStreakRef.current += 1;
    bestStreakRef.current = Math.max(bestStreakRef.current, currentStreakRef.current);
    scoreRef.current += 100;
    const nextFound = speedFound + 1;
    if (nextFound >= 3) {
      setSpeedFound(0);
      setFeedback("Lovely. New pattern!");
      setSpeedBoard(makeSpeedBoard());
      setSpeedTapped([]);
      window.setTimeout(() => setFeedback(""), 600);
    } else {
      setSpeedFound(nextFound);
      setFeedback("Found one!");
      window.setTimeout(() => setFeedback(""), 450);
    }
  };

  const submitTrackingGuess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const guess = Number.parseInt(trackingGuess, 10);
    if (Number.isNaN(guess)) return;
    const actual = dropPlan?.targetCount ?? 0;
    const difference = Math.abs(guess - actual);
    const accuracy = Math.max(0, Math.round(100 - (difference / Math.max(actual, 1)) * 100));
    const score = Math.max(0, Math.round(600 - difference * 115));
    setDropOutcome({ guess, actual, correct: guess === actual });
    finishRun(score, accuracy, 0);
  };

  const slowDown = () => {
    if (phase !== "playing" || slowLeft <= 0 || slowUntilRef.current > performance.now()) return;
    slowUntilRef.current = performance.now() + DROP_SLOW_MS;
    setSlowLeft((left) => left - 1);
  };

  const nextRound = () => {
    setFocusId(pickFocusColor(focusId));
    setPhase("ready");
  };

  const levelUp = () => {
    const next = dropLevel + 1;
    setDropLevel(next);
    try {
      window.localStorage.setItem(DROP_LEVEL_KEY, String(next));
    } catch {
      // storage can be unavailable (private mode); the level just won't be remembered
    }
    nextRound();
  };

  const timerPercent = (seconds / duration) * 100;
  const focusColor = DROP_COLORS.find((color) => color.id === focusId) ?? DROP_COLORS[0];
  const focusName = focusColor.label.toLowerCase();
  const modeTitle = game.title;

  return (
    <div className="game-overlay-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && phase !== "playing" && phase !== "answer") onClose(); }}>
      <section className={`game-window game-window-${game.tone}`} role="dialog" aria-modal="true" aria-labelledby="game-dialog-title">
        <header className="game-window-header">
          <div className="game-window-brand"><span className="brand-mark small-brand-mark"><Icon name="brain" size={17} strokeWidth={2.1} /></span><span>mindical<span>.</span><small> / TRAINING ROOM</small></span></div>
          {phase === "playing" && <div className="game-timer"><Icon name="clock" size={16} /><span>{`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}</span></div>}
          {phase !== "playing" && phase !== "answer" && <button className="modal-close game-close" onClick={onClose} aria-label="Close training game"><Icon name="close" size={19} /></button>}
          {phase === "answer" && <div className="game-timer"><Icon name="check" size={16} /><span>Your answer</span></div>}
        </header>

        {phase === "ready" && (
          <div className="game-ready-view">
            <div className={`game-ready-symbol tone-${game.tone}`}><Icon name={game.icon} size={34} /></div>
            <span className="ready-skill-label">{game.skill.toUpperCase()} <span>·</span> {game.duration.toUpperCase()}</span>
            <h2 id="game-dialog-title">{modeTitle}</h2>
            <p>{game.instruction}</p>
            <div className="how-to-note"><span className="how-to-check"><Icon name="check" size={14} /></span><span>{game.howTo}</span></div>
            {mode === "tracking" && (
              <div className="drop-setup">
                <div className="drop-setup-row"><span className="drop-setup-label">YOUR FOCUS COLOR</span><span className="focus-chip"><i style={{ background: focusColor.hex }} />{focusColor.label}</span></div>
                <div className="drop-setup-row"><span className="drop-setup-label">LEVEL</span><strong className="drop-level">{dropLevel}</strong></div>
                <span className="drop-setup-label">CHOOSE YOUR TIME</span>
                <div className="drop-times" role="radiogroup" aria-label="Choose your time">
                  {DROP_TIMES.map((time) => <button key={time} type="button" role="radio" aria-checked={trackingTime === time} className={`drop-time ${trackingTime === time ? "is-selected" : ""}`} onClick={() => setTrackingTime(time)}>{time}s</button>)}
                </div>
              </div>
            )}
            <button className="primary-button start-game-button" onClick={beginGame}>Let&apos;s play <Icon name="arrow" size={17} /></button>
            <button className="ready-back-link" onClick={onClose}>I&apos;ll come back later</button>
          </div>
        )}

        {phase === "playing" && mode === "tracking" && (
          <div className="game-playing-view tracking-view">
            <div className="playing-heading"><span className="playing-kicker">KEEP A QUIET TALLY</span><h2 id="game-dialog-title">Watch the {focusName} balls drop.</h2><p>Count them as they fall. Your answer can wait until the timer ends.</p></div>
            <div className="focus-chip"><i style={{ background: focusColor.hex }} />Counting: {focusColor.label}</div>
            <div ref={fieldRef} className={`drop-field ${slowActive ? "is-focus" : ""}`}>
              <span className="drop-field-label">{focusColor.label.toUpperCase()} BALLS ONLY <span>·</span> KEEP COUNT</span>
              {Array.from({ length: DROP_POOL }, (_, index) => <span key={index} ref={(node) => { poolRef.current[index] = node; }} className="drop-ball" aria-hidden="true" />)}
            </div>
            <button type="button" className="focus-button" onClick={slowDown} disabled={slowLeft <= 0 || slowActive}>{slowActive ? "Slowing down…" : `Slow down · ${slowLeft} left`}</button>
            <div className="timer-progress"><span style={{ width: `${timerPercent}%` }} /></div>
            <div className="tracking-hint"><span className="tracking-hint-dot" /> {seconds} seconds left <span>·</span> stay curious</div>
          </div>
        )}

        {phase === "answer" && mode === "tracking" && (
          <div className="game-playing-view tracking-answer-view">
            <div className="answer-success-icon"><Icon name="target" size={26} /></div>
            <span className="playing-kicker">TRUST YOUR COUNT</span>
            <h2 id="game-dialog-title">How many {focusName} balls?</h2>
            <p>Go with the number you kept in mind. No second guessing.</p>
            <form className="tracking-answer-form" onSubmit={submitTrackingGuess}>
              <label className="sr-only" htmlFor="tracking-count">Your {focusName} ball count</label>
              <input id="tracking-count" type="number" inputMode="numeric" min="0" max="99" autoFocus required value={trackingGuess} onChange={(event) => setTrackingGuess(event.target.value)} placeholder="0" />
              <span>balls</span>
              <button className="primary-button" type="submit">Lock it in <Icon name="arrow" size={16} /></button>
            </form>
            <span className="answer-soft-note"><Icon name="sparkle" size={14} /> Trust the first number that came to mind.</span>
          </div>
        )}

        {phase === "playing" && mode === "stroop" && question && (
          <div className="game-playing-view stroop-view">
            <div className="playing-heading"><span className="playing-kicker">WORD VS. INK</span><h2 id="game-dialog-title">Does the ink match?</h2><p>Answer quickly, but let your eyes do the thinking.</p></div>
            <div className="stroop-card"><span className="stroop-overline">THE WORD SAYS</span><strong style={{ color: question.ink.hex }}>{question.word.label}</strong><span className="stroop-question-caption">What color is the ink?</span></div>
            <div className="stroop-answer-buttons"><button className="stroop-answer yes-answer" onClick={() => answerStroop(true)}><span>✓</span> Yes, they match</button><button className="stroop-answer no-answer" onClick={() => answerStroop(false)}><span>↗</span> No, they don&apos;t</button></div>
            <div className={`game-feedback ${feedback ? "is-visible" : ""}`}>{feedback || "A new card is just around the corner."}</div>
            <div className="timer-progress"><span style={{ width: `${timerPercent}%` }} /></div>
          </div>
        )}

        {phase === "playing" && mode === "memory" && (
          <div className="game-playing-view memory-view">
            <div className="playing-heading"><span className="playing-kicker">{memoryStage === "watch" ? "WATCH THE PATTERN" : memoryStage === "recall" ? "YOUR TURN" : "PATTERN COMPLETE"}</span><h2 id="game-dialog-title">{memoryStage === "watch" ? "Take a mental snapshot." : memoryStage === "recall" ? "Tap it back in order." : "Beautifully done."}</h2><p>{memoryStage === "watch" ? "Let the lights guide you. You’ll repeat them next." : memoryStage === "recall" ? `${memoryInput.length} of ${memorySequence.length} remembered` : "That’s a pattern worth keeping."}</p></div>
            <div className="memory-grid" aria-label="Memory pattern grid">
              {Array.from({ length: 9 }, (_, tile) => <button key={tile} className={`memory-tile ${activeTile === tile ? "is-lit" : ""} ${memoryInput.includes(tile) ? "is-remembered" : ""}`} onClick={() => chooseMemoryTile(tile)} disabled={memoryStage !== "recall"} aria-label={`Pattern tile ${tile + 1}`}><span>{memoryInput.includes(tile) ? <Icon name="check" size={16} /> : ""}</span></button>)}
            </div>
            <div className="memory-progress-dots">{memorySequence.map((_, index) => <span className={index < memoryInput.length ? "is-done" : ""} key={index} />)}</div>
            <div className="timer-progress"><span style={{ width: `${timerPercent}%` }} /></div>
          </div>
        )}

        {phase === "playing" && mode === "speed" && (
          <div className="game-playing-view speed-view">
            <div className="playing-heading"><span className="playing-kicker">FIND THREE MATCHES</span><h2 id="game-dialog-title">Spot the little lookalikes.</h2><p>Tap every <span className="speed-target">{speedBoard.target}</span> you see. Ignore the decoys.</p></div>
            <div className="speed-target-card"><span>YOUR TARGET</span><strong>{speedBoard.target}</strong><div className="target-progress-dots">{[0, 1, 2].map((dot) => <i className={dot < speedFound ? "is-found" : ""} key={dot} />)}</div></div>
            <div className="speed-grid">{speedBoard.tiles.map((symbol, index) => <button key={`${index}-${speedBoard.target}`} className={`speed-tile ${speedTapped.includes(index) ? symbol === speedBoard.target ? "is-correct" : "is-wrong" : ""}`} onClick={() => chooseSpeedTile(index)} disabled={speedTapped.includes(index)} aria-label={`Symbol ${index + 1}`}>{symbol}</button>)}</div>
            <div className={`game-feedback ${feedback ? "is-visible" : ""}`}>{feedback || "One grid at a time. You’ve got this."}</div>
            <div className="timer-progress"><span style={{ width: `${timerPercent}%` }} /></div>
          </div>
        )}

        {phase === "complete" && summary && (
          <div className="game-result-view">
            <div className={`result-confetti result-confetti-${game.tone}`}><span>✦</span><span>·</span><span>✧</span><span>✦</span><span>·</span><span>✧</span><div className="result-medal"><Icon name="award" size={31} /></div></div>
            <span className="playing-kicker">A MOMENT WELL SPENT</span>
            <h2 id="game-dialog-title">That was a good brain day.</h2>
            <p>{summary.accuracy >= 80 ? "Look at you, finding your focus." : "Every rep is a little more practice for your mind."}</p>
            {mode === "tracking" && dropOutcome && (
              <div className={`drop-verdict ${dropOutcome.correct ? "is-correct" : "is-wrong"}`}>
                {dropOutcome.correct
                  ? `Correct! There were ${dropOutcome.actual} ${focusName} balls.`
                  : `Not quite. There were ${dropOutcome.actual} ${focusName} balls, and you counted ${dropOutcome.guess}.`}
              </div>
            )}
            <div className="result-metrics"><div><span>YOUR SCORE</span><strong>{summary.score.toLocaleString()}</strong></div><div><span>ACCURACY</span><strong>{summary.accuracy}<small>%</small></strong></div><div><span>BEST STREAK</span><strong>{summary.bestStreak}<small>×</small></strong></div></div>
            <div className={`xp-earned ${saveState === "offline" ? "is-offline" : ""}`}><span className="xp-earned-icon"><Icon name={saveState === "offline" ? "sparkle" : "award"} size={17} /></span><span>{saveState === "saving" ? "Adding your progress…" : saveState === "offline" ? "Session complete · sync unavailable" : "A little more progress"}</span>{saveState === "saved" && <strong>+{xpAward ?? 0} XP</strong>}</div>
            {mode === "tracking" && dropOutcome ? (
              <>
                <div className="result-actions">
                  {dropOutcome.correct && <button className="primary-button" onClick={levelUp}>Level up · {dropLevel + 1} <Icon name="arrow" size={16} /></button>}
                  <button className={dropOutcome.correct ? "secondary-button" : "primary-button"} onClick={nextRound}>Retry</button>
                </div>
                <button className="ready-back-link" onClick={onClose}>Back to my day</button>
              </>
            ) : (
              <div className="result-actions"><button className="primary-button" onClick={onClose}>Back to my day <Icon name="arrow" size={16} /></button><button className="secondary-button" onClick={beginGame}>Play again</button></div>
            )}
            {saveState === "saved" && <div className="saved-note"><Icon name="check" size={13} /> Your session has been added to your progress.</div>}
          </div>
        )}
      </section>
    </div>
  );
}
