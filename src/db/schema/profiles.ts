import { sql } from "drizzle-orm";
import { boolean, check, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

// One row per account (docs/architecture.md §6.3), created by the handle_new_user trigger on sign-up
// and deleted with the account. Only the owner reads and updates it; nobody inserts or deletes it
// directly, so there are no insert or delete policies. The locale check, the time-zone trigger and
// the column privileges need SQL functions, so they live in the hand-written migration
// supabase/migrations/20261025172409_profiles-sign-up-trigger.sql.
export const profiles = pgTable(
  "profiles",
  {
    id: uuid()
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    avatarPath: text("avatar_path"),
    locale: text().notNull().default("en"),
    timeZone: text("time_zone").notNull().default("UTC"),
    theme: text().notNull().default("system"),
    isMinor: boolean("is_minor").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("profiles_display_name_length", sql`char_length(${table.displayName}) between 1 and 50`),
    check("profiles_theme", sql`${table.theme} in ('system', 'light', 'dark')`),
    pgPolicy("profiles_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.id} = ${authUid}`,
    }),
    pgPolicy("profiles_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.id} = ${authUid}`,
      withCheck: sql`${table.id} = ${authUid}`,
    }),
  ],
).enableRLS();
