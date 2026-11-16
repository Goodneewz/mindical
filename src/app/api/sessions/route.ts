import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mindicalProfiles, mindicalSessions } from "@/db/schema";
import { getUserId } from "@/lib/auth/session";

// A round lasts at least 30 seconds, so saving faster than this is a script, not a player.
const MIN_GAP_MS = 4_000;

class TooFastError extends Error {}
const validModes = ["tracking", "stroop", "memory", "speed"] as const;
type GameMode = (typeof validModes)[number];

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

function utcDayNumber(date: Date) {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000,
  );
}

export async function POST(request: Request) {
  const playerId = await getUserId();
  if (!playerId) return Response.json({ error: "Please sign in." }, { status: 401 });

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid session details." }, { status: 400 });
  }

  const values = body as Record<string, unknown>;
  const mode = values.mode;
  const score = values.score;
  const accuracy = values.accuracy;
  const durationSeconds = values.durationSeconds;
  const bestStreak = values.bestStreak ?? 0;

  if (
    typeof mode !== "string" ||
    !validModes.includes(mode as GameMode) ||
    !isIntegerInRange(score, 0, 50_000) ||
    !isIntegerInRange(accuracy, 0, 100) ||
    !isIntegerInRange(durationSeconds, 1, 180) ||
    !isIntegerInRange(bestStreak, 0, 500)
  ) {
    return Response.json({ error: "Session values are invalid." }, { status: 400 });
  }

  const now = new Date();
  const xpEarned = Math.min(200, Math.max(12, Math.round(score / 75 + accuracy * 0.32)));

  try {
    const result = await db.transaction(async (transaction) => {
      // "for update" locks this player's row, so two saves at once can't overwrite each other's XP.
      const [profile] = await transaction
        .select()
        .from(mindicalProfiles)
        .where(eq(mindicalProfiles.id, playerId))
        .limit(1)
        .for("update");

      if (!profile) {
        throw new Error("Profile was unavailable during session save.");
      }
      if (profile.lastPlayedAt && now.getTime() - profile.lastPlayedAt.getTime() < MIN_GAP_MS) {
        throw new TooFastError();
      }

      const daysSinceLastPlay = profile.lastPlayedAt
        ? utcDayNumber(now) - utcDayNumber(profile.lastPlayedAt)
        : null;
      const nextStreak =
        daysSinceLastPlay === 0
          ? Math.max(profile.streak, 1)
          : daysSinceLastPlay === 1
            ? profile.streak + 1
            : 1;

      const [session] = await transaction
        .insert(mindicalSessions)
        .values({
          playerId,
          mode,
          score,
          accuracy,
          durationSeconds,
          bestStreak,
          xpEarned,
          createdAt: now,
        })
        .returning();

      const [updatedProfile] = await transaction
        .update(mindicalProfiles)
        .set({
          xp: profile.xp + xpEarned,
          streak: nextStreak,
          lastPlayedAt: now,
        })
        .where(eq(mindicalProfiles.id, playerId))
        .returning();

      return { session, profile: updatedProfile };
    });

    return Response.json({ ...result, xpEarned }, { status: 201 });
  } catch (error) {
    if (error instanceof TooFastError) {
      return Response.json({ error: "You're playing a little fast. Try again in a moment." }, { status: 429 });
    }
    if (error instanceof Error && error.message === "Profile was unavailable during session save.") {
      return Response.json({ error: "Choose a username to continue.", code: "no-profile" }, { status: 404 });
    }
    console.error("Mindical session save failed:", error);
    return Response.json({ error: "Unable to save this training session." }, { status: 500 });
  }
}
