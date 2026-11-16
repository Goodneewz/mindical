import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const mindicalProfiles = pgTable(
  "mindical_profiles",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    displayName: varchar("display_name", { length: 32 })
      .notNull()
      .default("Mindical learner"),
    xp: integer("xp").notNull().default(0),
    streak: integer("streak").notNull().default(0),
    lastPlayedAt: timestamp("last_played_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Usernames are unique, ignoring upper/lower case ("Ude" and "ude" are the same name).
    uniqueIndex("mindical_profiles_username_lower_idx").on(sql`lower(${table.displayName})`),
    index("mindical_profiles_xp_idx").on(table.xp),
  ],
);

export const mindicalSessions = pgTable(
  "mindical_sessions",
  {
    id: serial("id").primaryKey(),
    playerId: varchar("player_id", { length: 64 })
      .notNull()
      .references(() => mindicalProfiles.id, { onDelete: "cascade" }),
    mode: varchar("mode", { length: 32 }).notNull(),
    score: integer("score").notNull(),
    accuracy: integer("accuracy").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    bestStreak: integer("best_streak").notNull().default(0),
    xpEarned: integer("xp_earned").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("mindical_sessions_player_created_idx").on(
      table.playerId,
      table.createdAt,
    ),
    index("mindical_sessions_score_idx").on(table.score),
  ],
);
