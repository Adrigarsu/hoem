import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

export const householdType = pgEnum("household_type", ["single", "family", "shared_flat", "other"]);
export const memberRole = pgEnum("member_role", ["owner", "member"]);
export const familyRole = pgEnum("family_role", ["parent", "child", "relative"]);

// Households and who belongs to them (docs/architecture.md §6.3). Every policy in the app checks
// memberships through the helpers in the private schema (§7.1). The helpers, the policies and the
// triggers need SQL functions, so they live at the end of this table's migration,
// supabase/migrations/20261026014430_households.sql.
export const households = pgTable(
  "households",
  {
    id: uuid()
      .primaryKey()
      .default(sql`public.uuid_generate_v7()`),
    name: text().notNull(),
    type: householdType().notNull(),
    currency: char({ length: 3 }).notNull().default("EUR"),
    // The type's rules (src/features/households/schemas.ts), written in full when the household is
    // created (#16); the {} default never reaches a real household.
    settings: jsonb().notNull().default({}),
    createdBy: uuid("created_by").references(() => authUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("households_created_by_idx").on(table.createdBy)],
).enableRLS();

export const memberships = pgTable(
  "memberships",
  {
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: memberRole().notNull().default("member"),
    // Required in family households and refused in the others (trigger).
    familyRole: familyRole("family_role"),
    canJoinSplits: boolean("can_join_splits").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.householdId, table.userId] }),
    // The primary key already serves lookups by household; this one serves "my households".
    index("memberships_user_id_idx").on(table.userId),
  ],
).enableRLS();
