import { and, asc, eq, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { db, foods } from '@/db';
import { getAuthUserId, unauthorized } from '@/lib/server-auth';
 
const FOOD_COLUMNS = {
    id: foods.id,
    name: foods.name,
    category: foods.category,
    imageUrl: foods.imageUrl,
    calories: foods.calories,
    proteinG: foods.proteinG,
    carbsG: foods.carbsG,
    fatG: foods.fatG,
    servingNote: foods.servingNote,
};

const querySchema = z.object({
    q: z.string().trim().max(60).optional(),
    category: z.enum(['breakfast', 'lunch', 'dinner', 'snacks', 'shakes']).optional(),
})

export async function GET(request: Request) {
    const clerkUserId = await getAuthUserId(request)
    if (!clerkUserId) return unauthorized()

        const params = new URL(request.url).searchParams
        const parsed = querySchema.safeParse({
            q: params.get('q') || undefined,
            category: params.get('category') || undefined,
        })
        if (!parsed.success) {
            return Response.json({ error: 'Invalid query', issues: parsed.error.issues}, {status: 400})
        }

        const { q, category} = parsed.data

        const escaped = q?.replace(/[\\%_]/g, (c) => `\\${c}`)

        return Response.json(
            await db
            .select(FOOD_COLUMNS)
            .from(foods)
            .where(
                and(
                    category ? eq(foods.category, category) : undefined,
                    escaped ? ilike(foods.name, `%${escaped}%`) : undefined
                ),
            )
            .orderBy(asc(foods.name))
            .limit(50),
        )
}