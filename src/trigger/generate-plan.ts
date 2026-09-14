import { logger, schemaTask } from '@trigger.dev/sdk';
import OpenAI from 'openai';
import { z } from 'zod';

// Relative, not "@/" — these tasks are bundled by Trigger.dev, not Metro.
import {
  ageFrom,
  formulaPlan,
  isPlausible,
  planInputSchema,
  type Plan,
  type PlanInput,
} from '../lib/plan';

// Groq punya API yang kompatibel dengan SDK OpenAI, tinggal ganti baseURL + apiKey.
const MODEL = 'llama-3.3-70b-versatile'; // model gratis Groq, cepat & cukup pintar

const SYSTEM_PROMPT = `You are a registered dietitian building a daily nutrition target for one person.

Rules:
- Start from Mifflin-St Jeor BMR, multiply by their activity factor, then adjust for their goal and weekly pace (1 kg of body weight is roughly 7700 kcal).
- Keep calories between 1200 and 5000.
- protein_g * 4 + carbs_g * 4 + fat_g * 9 must equal the calorie target within 2%.
- Respect the diet preference: keto is very low carb and high fat; vegan and vegetarian lean carb-heavier with moderate protein; classic is balanced.
- Protein should support their goal — higher when losing weight, to protect muscle.
- rationale: one short second-person sentence explaining how the target was derived. Do not repeat the numbers back.
- Respond with ONLY a JSON object, no markdown, no extra text, matching exactly this shape:
{"calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "rationale": string}`;

const aiPlanSchema = z.object({
  calories: z.number().int(),
  protein_g: z.number().int(),
  carbs_g: z.number().int(),
  fat_g: z.number().int(),
  rationale: z.string(),
});

async function askGroq(input: PlanInput): Promise<Plan> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  // Constructed per call so a missing key fails inside the try, not at import time.
  const groq = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
    timeout: 25_000,
    maxRetries: 0,
  });

  const response = await groq.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({ ...input, age: ageFrom(input.dateOfBirth) }),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error('Groq returned no content');

  const out = aiPlanSchema.parse(JSON.parse(raw));

  return {
    calories: out.calories,
    protein: out.protein_g,
    carbs: out.carbs_g,
    fat: out.fat_g,
    rationale: out.rationale,
  };
}

/**
 * Onboarding answers → validated daily targets.
 *
 * Never throws: kalau AI gagal/hasil tidak masuk akal, otomatis fallback ke
 * rumus Mifflin-St Jeor (lib/plan.ts) supaya user tetap dapat angka.
 */
export const generatePlan = schemaTask({
  id: 'generate-plan',
  schema: planInputSchema,
  maxDuration: 120,
  run: async (input) => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const plan = await askGroq(input);
        if (isPlausible(plan)) return { ...plan, source: 'ai' as const };
        logger.warn('Implausible plan, discarding', { attempt, plan });
      } catch (error) {
        logger.error('Groq plan generation failed', { attempt, error: String(error) });
      }
    }

    return { ...formulaPlan(input), source: 'formula' as const };
  },
});