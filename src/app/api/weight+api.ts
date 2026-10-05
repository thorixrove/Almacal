import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, users, weightLogs } from '@/db'
import { getAuthUserId, unauthorized } from '@/lib/server-auth'

const logWeightSchema = z.object({
    weightKg: z.number().min(20).max(400),
})

export async function POST(request: Request) {
    const clerkUserId = await getAuthUserId(request)
    if (!clerkUserId) return unauthorized()

    const parsed = logWeightSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
        return Response.json({ error: 'Invalid weight', issues: parsed.error.issues }, { status: 400 })
    }

    const { weightKg } = parsed.data

    const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))

    if (!user) return Response.json({ error: 'Finish onboarding first' }, { status: 409 })

    const [[log]] = await db.batch([
        db.insert(weightLogs).values({ userId: user.id, weightKg }).returning(),
        db.update(users).set({ weightKg }).where(eq(users.id, user.id)),
    ])

    return Response.json(log)

}