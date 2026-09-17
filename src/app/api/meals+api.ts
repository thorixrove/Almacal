import { task, tasks } from '@trigger.dev/sdk';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, meals, users } from '@/db';
import { uploadToImageKit } from '@/lib/imagekit';
import { getAuthUserId, unauthorized } from '@/lib/server-auth';

import type { analyzeMeal } from '@/trigger/analyze-meal';


const MEAL_COLUMNS = {
    id: meals.id,
    imageUrl: meals.imageUrl,
    status: meals.status,
    name: meals.name,
    calories: meals.calories,
    proteinG: meals.proteinG,
    carbsG: meals.carbsG,
    fatG: meals.fatG,
    errorReason: meals.errorReason,
    loggedAt: meals.loggedAt,
};


export async function GET(request: Request) {
    const clerkUserId = await getAuthUserId(request)
    if (!clerkUserId) return unauthorized()

    const date = new URL(request.url).searchParams.get('date')
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return Response.json({ error: 'Expected ?date=YYYY-MM-DD' }, { status: 400 })
    }

    const [user] = await db
        .select({ id: users.id, timezone: users.timezone })
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))

    if (!user) return Response.json([])

    return Response.json(
        await db
            .select(MEAL_COLUMNS)
            .from(meals)
            .where(
                and(
                    eq(meals.userId, user.id),
                    sql`(${meals.loggedAt} AT TIME ZONE ${user.timezone ?? 'UTC'})::date = ${date}::date`,
                ),
            )
            .orderBy(desc(meals.loggedAt))
    )
}

const logMealSchema = z.object({
    image: z.string().min(100).max(12_000_000),
})

export async function POST(request: Request) {
    const clerkUserId = await getAuthUserId(request)
    if (!clerkUserId) return unauthorized()

    const parsed = logMealSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
        return Response.json({ error: 'Invalid photo', issues: parsed.error.issues }, { status: 400 })
    }

    const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))


    if (!user) return Response.json({ error: 'Finish onboarding first' }, { status: 409 })

    const imageUrl = await uploadToImageKit(parsed.data.image, `meal-${user.id}-${Date.now()}.jpg`)

    const [meal] = await db.insert(meals).values({ userId: user.id, imageUrl }).returning()

    const handle = await tasks.trigger<typeof analyzeMeal>('analyze-meal', {
        mealId: meal.id,
        imageUrl,
    })

    await db.update(meals).set({ triggerRunId: handle.id }).where(eq(meals.id, meal.id))

    return Response.json({
        meal,
        runId: handle.id,
        publicAccessToken: handle.publicAccessToken,
    })
}
