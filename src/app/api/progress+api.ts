import { and, asc, eq, sql } from 'drizzle-orm'
import { db, meals, users, weightLogs } from '@/db'
import { getAuthUserId, unauthorized } from '@/lib/server-auth'

const DEFAULT_DAYS = 30
const MAX_DAYS = 90
// Streak dihitung dari tanggal log, jadi jendela datanya dibuat lebih panjang dari grafik.
const LOG_WINDOW_DAYS = 90
// Kalori harian dianggap "hit" jika masuk dalam ±10% dari target.
const HIT_TOLERANCE = 0.1

export type ProgressDayStatus = 'hit' | 'miss' | 'none'

export type ProgressResponse = {
    days: number
    /** Tanggal hari ini (YYYY-MM-DD) di zona waktu user, dihitung server. */
    today: string
    /** Hari berturut-turut yang ada log, dihitung mundur dari hari ini (maks. 90). */
    streak: number
    currentWeightKg: number | null
    dailyCalories: number | null
    /** Target harian user; null kalau belum diatur. */
    targets: { calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null }
    /** Satu entri per hari di rentang `days`, urut lama → baru. `logged` false = tidak ada meal. */
    daily: { date: string; logged: boolean; calories: number; proteinG: number; carbsG: number; fatG: number }[]
    /** Satu titik per hari (log terakhir hari itu), urut lama → baru. */
    weight: { date: string; value: number }[]
    /** Satu entri per hari di rentang `days`, urut lama → baru. */
    consistency: { date: string; status: ProgressDayStatus }[]
    /** Tanggal lokal (YYYY-MM-DD) yang punya minimal satu meal selesai, 90 hari terakhir. */
    loggedDates: string[]
}

const emptyProgress = (days: number): ProgressResponse => ({
    days,
    today: todayIn('UTC'),
    streak: 0,
    currentWeightKg: null,
    dailyCalories: null,
    targets: { calories: null, proteinG: null, carbsG: null, fatG: null },
    daily: [],
    weight: [],
    consistency: [],
    loggedDates: [],
})

/** Tanggal hari ini (YYYY-MM-DD) di zona waktu user. */
function todayIn(timeZone: string) {
    try {
        return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())
    } catch {
        return new Date().toISOString().slice(0, 10)
    }
}

/** Geser string tanggal YYYY-MM-DD sebanyak n hari tanpa terpengaruh zona waktu. */
function shiftDate(iso: string, n: number) {
    const d = new Date(`${iso}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + n)
    return d.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
    const clerkUserId = await getAuthUserId(request)
    if (!clerkUserId) return unauthorized()

    const rawDays = Number(new URL(request.url).searchParams.get('days') ?? DEFAULT_DAYS)
    const days = Number.isFinite(rawDays)
        ? Math.min(Math.max(Math.floor(rawDays), 1), MAX_DAYS)
        : DEFAULT_DAYS

    const [user] = await db
        .select({
            id: users.id,
            timezone: users.timezone,
            weightKg: users.weightKg,
            dailyCalories: users.dailyCalories,
            proteinG: users.proteinG,
            carbsG: users.carbsG,
            fatG: users.fatG,
        })
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))

    if (!user) return Response.json(emptyProgress(days))

    const tz = user.timezone ?? 'UTC'
    const today = todayIn(tz)
    const rangeStart = shiftDate(today, -(days - 1))
    const logStart = shiftDate(today, -(LOG_WINDOW_DAYS - 1))

    const mealDay = sql<string>`to_char(${meals.loggedAt} AT TIME ZONE ${tz}, 'YYYY-MM-DD')`
    const weightDay = sql<string>`to_char(${weightLogs.loggedAt} AT TIME ZONE ${tz}, 'YYYY-MM-DD')`

    const [mealRows, weightRows] = await Promise.all([
        db
            .select({
                date: mealDay,
                calories: sql<number>`coalesce(sum(${meals.calories}), 0)::int`,
                proteinG: sql<number>`coalesce(sum(${meals.proteinG}), 0)::int`,
                carbsG: sql<number>`coalesce(sum(${meals.carbsG}), 0)::int`,
                fatG: sql<number>`coalesce(sum(${meals.fatG}), 0)::int`,
            })
            .from(meals)
            .where(
                and(
                    eq(meals.userId, user.id),
                    eq(meals.status, 'completed'),
                    sql`(${meals.loggedAt} AT TIME ZONE ${tz})::date >= ${logStart}::date`,
                ),
            )
            .groupBy(sql`1`),
        db
            .select({ date: weightDay, value: weightLogs.weightKg })
            .from(weightLogs)
            .where(
                and(
                    eq(weightLogs.userId, user.id),
                    sql`(${weightLogs.loggedAt} AT TIME ZONE ${tz})::date >= ${rangeStart}::date`,
                ),
            )
            .orderBy(asc(weightLogs.loggedAt)),
    ])

    // Log terakhir di hari yang sama yang dipakai.
    const weightByDate = new Map<string, number>()
    for (const row of weightRows) weightByDate.set(row.date, row.value)
    const weight = [...weightByDate].map(([date, value]) => ({ date, value }))

    const caloriesByDate = new Map(mealRows.map((r) => [r.date, r.calories]))
    const mealsByDate = new Map(mealRows.map((r) => [r.date, r]))
    const target = user.dailyCalories

    const consistency = Array.from({ length: days }, (_, i) => {
        const date = shiftDate(rangeStart, i)
        const calories = caloriesByDate.get(date)

        let status: ProgressDayStatus = 'none'
        if (target && calories !== undefined) {
            const isHit = Math.abs(calories - target) <= target * HIT_TOLERANCE
            // Hari ini masih berjalan: baru dihitung kalau sudah hit, supaya belum dianggap miss.
            status = isHit ? 'hit' : date === today ? 'none' : 'miss'
        }
        return { date, status }
    })

    // Streak: kalau hari ini belum ada log, belum putus — hitungan mulai dari kemarin.
    let cursor = caloriesByDate.has(today) ? today : shiftDate(today, -1)
    let streak = 0
    while (caloriesByDate.has(cursor)) {
        streak += 1
        cursor = shiftDate(cursor, -1)
    }

    const daily = Array.from({ length: days }, (_, i) => {
        const date = shiftDate(rangeStart, i)
        const row = mealsByDate.get(date)
        return {
            date,
            logged: !!row,
            calories: row?.calories ?? 0,
            proteinG: row?.proteinG ?? 0,
            carbsG: row?.carbsG ?? 0,
            fatG: row?.fatG ?? 0,
        }
    })

    const body: ProgressResponse = {
        days,
        today,
        streak,
        currentWeightKg: user.weightKg,
        dailyCalories: target,
        targets: {
            calories: target,
            proteinG: user.proteinG,
            carbsG: user.carbsG,
            fatG: user.fatG,
        },
        daily,
        weight,
        consistency,
        loggedDates: [...caloriesByDate.keys()].sort(),
    }

    return Response.json(body)
}