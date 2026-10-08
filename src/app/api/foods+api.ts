import { and, asc, desc, eq, gte, ilike, isNotNull, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, meals, users } from '@/db';
import { getAuthUserId, unauthorized } from '@/lib/server-auth';

const FOOD_COLUMNS = {
    id: meals.id,
    imageUrl: meals.imageUrl,
    name: meals.name,
    calories: meals.calories,
    proteinG: meals.proteinG,
    carbsG: meals.carbsG,
    fatG: meals.fatG,
    loggedAt: meals.loggedAt,
};

const num = z.coerce.number().int().min(0).max(10000).optional()

const querySchema = z.object({
    q: z.string().trim().max(60).optional(),
    category: z.enum(['breakfast', 'lunch', 'dinner', 'snacks']).optional(),
    sort: z.enum(['newest', 'oldest', 'calories', 'protein']).default('newest'),
    days: z.coerce.number().int().min(1).max(365).optional(),
    minProtein: num,
    minCalories: num,
    maxCalories: num,
})

export async function GET(request: Request) {
    const clerkUserId = await getAuthUserId(request)
    if (!clerkUserId) return unauthorized()

    const params = new URL(request.url).searchParams
    const parsed = querySchema.safeParse(
        Object.fromEntries(
            ['q', 'category', 'sort', 'days', 'minProtein', 'minCalories', 'maxCalories'].map((k) => [
                k,
                params.get(k) || undefined,
            ]),
        ),
    )
    if (!parsed.success) {
        return Response.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 })
    }

    const { q, category, sort, days, minProtein, minCalories, maxCalories } = parsed.data

    const [user] = await db
        .select({ id: users.id, timezone: users.timezone })
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))

    if (!user) return Response.json([])

    const tz = user.timezone ?? 'UTC'
    const hour = sql`extract(hour from ${meals.loggedAt} AT TIME ZONE ${tz})`
    const slots = {
        breakfast: sql`${hour} < 11`,
        lunch: sql`${hour} >= 11 and ${hour} < 16`,
        dinner: sql`${hour} >= 16 and ${hour} < 21`,
        snacks: sql`${hour} >= 21`,
    }

    const escaped = q?.replace(/[\\%_]/g, (c) => `\\${c}`)

    const orderBy = {
        newest: desc(meals.loggedAt),
        oldest: asc(meals.loggedAt),
        calories: sql`${meals.calories} desc nulls last`,
        protein: sql`${meals.proteinG} desc nulls last`,
    }[sort]

    return Response.json(
        await db
            .select(FOOD_COLUMNS)
            .from(meals)
            .where(
                and(
                    eq(meals.userId, user.id),
                    eq(meals.status, 'completed'),
                    isNotNull(meals.name),
                    category ? slots[category] : undefined,
                    escaped ? ilike(meals.name, `%${escaped}%`) : undefined,
                    days
                        ? sql`(${meals.loggedAt} AT TIME ZONE ${tz})::date >= (now() AT TIME ZONE ${tz})::date - ${days - 1}::int`
                        : undefined,
                    minProtein !== undefined ? gte(meals.proteinG, minProtein) : undefined,
                    minCalories !== undefined ? gte(meals.calories, minCalories) : undefined,
                    maxCalories !== undefined ? lte(meals.calories, maxCalories) : undefined,
                ),
            )
            .orderBy(orderBy, desc(meals.loggedAt))
            .limit(100),
    )
}