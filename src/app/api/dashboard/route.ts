import { asc, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { mindicalProfiles, mindicalSessions } from "@/db/schema";
import { getUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// The leaderboard is the same for everyone, so each server instance keeps it for a few seconds.
// With thousands of players this turns thousands of identical database queries into one.
const LEADERBOARD_TTL_MS = 10_000;
type LeaderboardRow = { id: string; displayName: string; xp: number; streak: number };
let leaderboardCache: { at: number; rows: LeaderboardRow[] } | null = null;

async function loadLeaderboard(): Promise<LeaderboardRow[]> {
  const now = Date.now();
  if (leaderboardCache && now - leaderboardCache.at < LEADERBOARD_TTL_MS) return leaderboardCache.rows;

  const rows = await db
    .select({
      id: mindicalProfiles.id,
      displayName: mindicalProfiles.displayName,
      xp: mindicalProfiles.xp,
      streak: mindicalProfiles.streak,
    })
    .from(mindicalProfiles)
    .where(gt(mindicalProfiles.xp, 0))
    .orderBy(desc(mindicalProfiles.xp), asc(mindicalProfiles.displayName))
    .limit(5);

  leaderboardCache = { at: now, rows };
  return rows;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Please sign in." }, { status: 401 });

  try {
    const [profile] = await db.select().from(mindicalProfiles).where(eq(mindicalProfiles.id, userId)).limit(1);

    if (!profile) {
      return Response.json({ error: "Choose a username to continue.", code: "no-profile" }, { status: 404 });
    }

    const [sessions, leaderboard] = await Promise.all([
      db
        .select({
          id: mindicalSessions.id,
          mode: mindicalSessions.mode,
          score: mindicalSessions.score,
          accuracy: mindicalSessions.accuracy,
          durationSeconds: mindicalSessions.durationSeconds,
          bestStreak: mindicalSessions.bestStreak,
          xpEarned: mindicalSessions.xpEarned,
          createdAt: mindicalSessions.createdAt,
        })
        .from(mindicalSessions)
        .where(eq(mindicalSessions.playerId, userId))
        .orderBy(desc(mindicalSessions.createdAt))
        .limit(12),
      loadLeaderboard(),
    ]);

    return Response.json({ profile, sessions, leaderboard });
  } catch (error) {
    console.error("Mindical dashboard query failed:", error);
    return Response.json({ error: "Unable to load training data." }, { status: 500 });
  }
}
