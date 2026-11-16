import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mindicalProfiles } from "@/db/schema";
import { getUserId } from "@/lib/auth/session";
import { cleanUsername, validateUsername } from "@/lib/username";

export const dynamic = "force-dynamic";

const profileColumns = {
  id: mindicalProfiles.id,
  displayName: mindicalProfiles.displayName,
  xp: mindicalProfiles.xp,
  streak: mindicalProfiles.streak,
  lastPlayedAt: mindicalProfiles.lastPlayedAt,
};

// 23505 = Postgres "unique violation": someone already has that username.
// The database driver wraps the original error, so look one or two levels down as well.
function isUsernameTaken(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 3 && current && typeof current === "object"; depth += 1) {
    if ((current as { code?: unknown }).code === "23505") return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Please sign in." }, { status: 401 });

  try {
    const [profile] = await db.select(profileColumns).from(mindicalProfiles).where(eq(mindicalProfiles.id, userId)).limit(1);
    if (!profile) return Response.json({ error: "Choose a username to continue.", code: "no-profile" }, { status: 404 });
    return Response.json({ profile });
  } catch (error) {
    console.error("Mindical profile load failed:", error);
    return Response.json({ error: "Unable to load your profile." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Please sign in." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const displayName = body && typeof body === "object" ? (body as Record<string, unknown>).displayName : undefined;
  if (typeof displayName !== "string") {
    return Response.json({ error: "Choose a username." }, { status: 400 });
  }

  const problem = validateUsername(displayName);
  if (problem) return Response.json({ error: problem }, { status: 400 });
  const username = cleanUsername(displayName);

  try {
    const [profile] = await db
      .insert(mindicalProfiles)
      .values({ id: userId, displayName: username })
      .onConflictDoUpdate({ target: mindicalProfiles.id, set: { displayName: username } })
      .returning(profileColumns);

    return Response.json({ profile });
  } catch (error) {
    if (isUsernameTaken(error)) {
      return Response.json({ error: "That username is taken. Try another." }, { status: 409 });
    }
    console.error("Mindical profile update failed:", error);
    return Response.json({ error: "Unable to save your username." }, { status: 500 });
  }
}
