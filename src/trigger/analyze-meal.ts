import { logger, schemaTask } from '@trigger.dev/sdk';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { z } from 'zod';

// Relative, not "@/" — these tasks are bundled by Trigger.dev, not Metro.
import { db, meals } from '../db';

const MODEL = 'qwen/qwen3.8-27b'; // model vision Groq yang aktif di akun ini (per Sept 2026)

/**
 * ImageKit resize applied only for the model's copy of the photo — the row keeps the
 * full-size URL for the UI.
 */
const VISION_TRANSFORM = '?tr=w-1024,q-80,f-jpg';

const SYSTEM_PROMPT = `You are a nutritionist estimating what is on a plate from a single photo.

Rules:
- is_food is false for anything that is not edible food or drink. When it is false, the other fields are ignored — return zeros and an empty name.
- name: what a person would call this meal, 2-4 words, no brand names. e.g. "Grilled chicken salad".
- Estimate the portion actually visible, using the plate, cutlery or hand for scale. Do not return a generic per-100g figure.
- protein_g * 4 + carbs_g * 4 + fat_g * 9 should land within 10% of calories.
- Respond with ONLY a JSON object, no markdown, no extra text, matching exactly this shape:
{"is_food": boolean, "name": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number}`;

const visionSchema = z.object({
  is_food: z.boolean(),
  name: z.string(),
  calories: z.number().int(),
  protein_g: z.number().int(),
  carbs_g: z.number().int(),
  fat_g: z.number().int(),
});

/**
 * Meal photo → macros, written back to the `meals` row.
 *
 * The row already exists in `analyzing` when this starts (POST /api/meals), so every
 * exit has to move it to `completed` or `failed` — a row left `analyzing` is a spinner
 * on Home forever.
 */
export const analyzeMeal = schemaTask({
  id: 'analyze-meal',
  schema: z.object({
    mealId: z.string().uuid(),
    imageUrl: z.string().url(),
  }),
  retry: { maxAttempts: 2 },
  maxDuration: 120,
  run: async ({ mealId, imageUrl }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not set');

    const groq = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
      timeout: 45_000,
      maxRetries: 0,
    });

    const response = await groq.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      // The response is a tiny fixed-shape JSON object — capped well under Groq's
      // on_demand OTPM limit (1000/min) to avoid 429s. Raise if the model starts
      // truncating valid JSON, but this schema shouldn't need more than ~150 tokens.
      max_tokens: 300,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl + VISION_TRANSFORM },
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Groq returned no content'); // retried once

    const out = visionSchema.parse(JSON.parse(raw));

    // A photo of a chair is not a meal that failed — it is not a meal. Dropping the
    // row keeps it out of Home, the totals and the streak without any of them
    // filtering for it.
    if (!out.is_food) {
      logger.warn('Photo is not food, discarding meal', { mealId });
      await db.delete(meals).where(eq(meals.id, mealId));
      return { status: 'failed' as const, errorReason: 'not_food' as const };
    }

    const result = {
      name: out.name,
      calories: out.calories,
      proteinG: out.protein_g,
      carbsG: out.carbs_g,
      fatG: out.fat_g,
    };

    await db
      .update(meals)
      .set({ ...result, status: 'completed' })
      .where(eq(meals.id, mealId));

    return { status: 'completed' as const, ...result };
  },
  onFailure: async ({ payload, error }) => {
    logger.error('analyze-meal exhausted retries', {
      mealId: payload.mealId,
      error: String(error),
    });
    await db
      .update(meals)
      .set({ status: 'failed', errorReason: 'analysis_failed' })
      .where(eq(meals.id, payload.mealId));
  },
});