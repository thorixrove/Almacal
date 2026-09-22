import {
  db,
  eq,
  sql,
  users
} from "../../../../../chunk-2SXWOCLK.mjs";
import {
  task
} from "../../../../../chunk-ARVRABRY.mjs";
import {
  __name,
  init_esm
} from "../../../../../chunk-CEGEFIIW.mjs";

// src/trigger/clerk-users.ts
init_esm();
function upsertUser({ clerkUserId, email }) {
  return db.insert(users).values({ clerkUserId, email }).onConflictDoUpdate({
    target: users.clerkUserId,
    set: {
      email: sql`coalesce(excluded.email, ${users.email})`,
      updatedAt: /* @__PURE__ */ new Date()
    }
  }).returning({ id: users.id });
}
__name(upsertUser, "upsertUser");
var clerkUserCreated = task({
  id: "clerk-user-created",
  run: /* @__PURE__ */ __name(async (payload) => {
    try {
      const [user] = await upsertUser(payload);
      return { userId: user.id };
    } catch (err) {
      console.error("INSERT FAILED:", err.message);
      console.error("CAUSE:", err.cause);
      throw err;
    }
  }, "run")
});
var clerkUserUpdated = task({
  id: "clerk-user-updated",
  run: /* @__PURE__ */ __name(async (payload) => {
    const [user] = await upsertUser(payload);
    return { userId: user.id };
  }, "run")
});
var clerkUserDeleted = task({
  id: "clerk-user-deleted",
  run: /* @__PURE__ */ __name(async (payload) => {
    const deleted = await db.delete(users).where(eq(users.clerkUserId, payload.clerkUserId)).returning({ id: users.id });
    return { deleted: deleted.length };
  }, "run")
});
export {
  clerkUserCreated,
  clerkUserDeleted,
  clerkUserUpdated
};
//# sourceMappingURL=clerk-users.mjs.map
