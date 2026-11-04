import { sql } from "drizzle-orm";
import { customType, index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { familyRole, households } from "./households";

// Case-insensitive, so "Marcos@Example.com" and "marcos@example.com" are one invitation. The
// extension lives in the extensions schema (created at the top of the migration).
const citext = customType<{ data: string }>({ dataType: () => "extensions.citext" });
const bytea = customType<{ data: Uint8Array }>({ dataType: () => "bytea" });

// Invitations to join a household (FR-ACC-005, docs/architecture.md §6.3). Only the SHA-256 of the
// token is stored: the token itself travels only in the e-mail, so a leaked row opens nothing.
// Rows are written only by private.create_invitation; the policies and the function are at the end
// of this table's migration, supabase/migrations/*_invitations.sql.
export const invitations = pgTable(
  "invitations",
  {
    id: uuid()
      .primaryKey()
      .default(sql`public.uuid_generate_v7()`),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    email: citext().notNull(),
    // Required in family households and refused in the others (private.create_invitation).
    familyRole: familyRole("family_role"),
    tokenHash: bytea("token_hash").notNull(),
    invitedBy: uuid("invited_by").references(() => authUsers.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("invitations_household_id_idx").on(table.householdId),
    index("invitations_invited_by_idx").on(table.invitedBy),
    uniqueIndex("invitations_token_hash_key").on(table.tokenHash),
    // One pending invitation per address and household: inviting again renews it.
    uniqueIndex("invitations_pending_email_key")
      .on(table.householdId, table.email)
      .where(sql`accepted_at is null`),
  ],
).enableRLS();
