import { task } from "@trigger.dev/sdk";
import { eq, sql } from "drizzle-orm";

// Relative, not "@/db" — these tasks are bundled by Trigger.dev, not Metro.
import { db, users } from "../db";

type SyncUserPayload = { clerkUserId: string; email: string | null };

function upsertUser({ clerkUserId, email }: SyncUserPayload) {
  return db
    .insert(users)
    .values({ clerkUserId, email })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: {
        email: sql`coalesce(excluded.email, ${users.email})`,
        updatedAt: new Date(),
      },
    })
    .returning({ id: users.id });
}

export const clerkUserCreated = task({
  id: "clerk-user-created",
  run: async (payload: SyncUserPayload) => {
    try {
      const [user] = await upsertUser(payload);
      return { userId: user.id };
    } catch (err: any) {
      console.error("INSERT FAILED:", err.message);
      console.error("CAUSE:", err.cause);
      throw err;
    }
  },
});
export const clerkUserUpdated = task({
  id: "clerk-user-updated",
  run: async (payload: SyncUserPayload) => {
    const [user] = await upsertUser(payload);
    return { userId: user.id };
  },
});

export const clerkUserDeleted = task({
  id: "clerk-user-deleted",
  run: async (payload: { clerkUserId: string }) => {
    // Their meals go too, via the meals.user_id FK's onDelete: "cascade".
    const deleted = await db
      .delete(users)
      .where(eq(users.clerkUserId, payload.clerkUserId))
      .returning({ id: users.id });

    return { deleted: deleted.length };
  },
});