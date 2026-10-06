import {
  OpenAI
} from "../../../../../chunk-6DWI2BR5.mjs";
import {
  external_exports,
  logger,
  schemaTask
} from "../../../../../chunk-ARVRABRY.mjs";
import {
  __name,
  init_esm
} from "../../../../../chunk-CEGEFIIW.mjs";

// src/trigger/generate-plan.ts
init_esm();

// src/lib/plan.ts
init_esm();
var planInputSchema = external_exports.object({
  gender: external_exports.enum(["male", "female"]),
  dateOfBirth: external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected yyyy-mm-dd"),
  heightCm: external_exports.number().min(80).max(260),
  weightKg: external_exports.number().min(25).max(400),
  goal: external_exports.enum(["lose", "maintain", "gain"]),
  targetWeightKg: external_exports.number().min(25).max(400),
  activityLevel: external_exports.enum(["sedentary", "light", "moderate", "very", "extra"]),
  paceKgPerWeek: external_exports.number().min(0).max(2),
  dietPreference: external_exports.enum(["classic", "keto", "vegan", "vegetarian"])
});
var YEAR_MS = 315576e5;
var ageFrom = /* @__PURE__ */ __name((dateOfBirth) => Math.max(14, Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / YEAR_MS)), "ageFrom");
function isPlausible(plan) {
  const numbers = [plan.calories, plan.protein, plan.carbs, plan.fat];
  if (numbers.some((n) => !Number.isFinite(n) || n < 0)) return false;
  if (plan.calories < 1200 || plan.protein > 5e3) return false;
  const fromMacros = plan.protein * 4 + plan.carbs * 4 + plan.fat * 9;
  return Math.abs(fromMacros - plan.calories) <= plan.calories * 0.15;
}
__name(isPlausible, "isPlausible");
var ACTIVITY_FACTOR = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9
};
var SPLIT = {
  classic: [0.3, 0.4, 0.3],
  keto: [0.25, 0.1, 0.65],
  vegan: [0.25, 0.5, 0.25],
  vegetarian: [0.25, 0.5, 0.25]
};
function formulaPlan(input) {
  const bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * ageFrom(input.dateOfBirth) + (input.gender === "female" ? -161 : 5);
  const tdee = bmr * ACTIVITY_FACTOR[input.activityLevel];
  const dailyDelta = input.paceKgPerWeek * 7700 / 7;
  const raw = tdee + (input.goal === "lose" ? -dailyDelta : input.goal === "gain" ? dailyDelta : 0);
  const calories = Math.round(Math.min(5e3, Math.max(1200, raw)) / 10) * 10;
  const [p, c, f] = SPLIT[input.dietPreference];
  return {
    calories,
    protein: Math.round(calories * p / 4),
    carbs: Math.round(calories * c / 4),
    fat: Math.round(calories * f / 9),
    rationale: `Based on your body stats and activity level, adjusted for your goal to ${input.goal} weight.`
  };
}
__name(formulaPlan, "formulaPlan");

// src/trigger/generate-plan.ts
var MODEL = "llama-3.3-70b-versatile";
var SYSTEM_PROMPT = `You are a registered dietitian building a daily nutrition target for one person.

Rules:
- Start from Mifflin-St Jeor BMR, multiply by their activity factor, then adjust for their goal and weekly pace (1 kg of body weight is roughly 7700 kcal).
- Keep calories between 1200 and 5000.
- protein_g * 4 + carbs_g * 4 + fat_g * 9 must equal the calorie target within 2%.
- Respect the diet preference: keto is very low carb and high fat; vegan and vegetarian lean carb-heavier with moderate protein; classic is balanced.
- Protein should support their goal — higher when losing weight, to protect muscle.
- rationale: one short second-person sentence explaining how the target was derived. Do not repeat the numbers back.
- Respond with ONLY a JSON object, no markdown, no extra text, matching exactly this shape:
{"calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "rationale": string}`;
var aiPlanSchema = external_exports.object({
  calories: external_exports.number().int(),
  protein_g: external_exports.number().int(),
  carbs_g: external_exports.number().int(),
  fat_g: external_exports.number().int(),
  rationale: external_exports.string()
});
async function askGroq(input) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  const groq = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
    timeout: 25e3,
    maxRetries: 0
  });
  const response = await groq.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({ ...input, age: ageFrom(input.dateOfBirth) })
      }
    ]
  });
  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Groq returned no content");
  const out = aiPlanSchema.parse(JSON.parse(raw));
  return {
    calories: out.calories,
    protein: out.protein_g,
    carbs: out.carbs_g,
    fat: out.fat_g,
    rationale: out.rationale
  };
}
__name(askGroq, "askGroq");
var generatePlan = schemaTask({
  id: "generate-plan",
  schema: planInputSchema,
  maxDuration: 120,
  run: /* @__PURE__ */ __name(async (input) => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const plan = await askGroq(input);
        if (isPlausible(plan)) return { ...plan, source: "ai" };
        logger.warn("Implausible plan, discarding", { attempt, plan });
      } catch (error) {
        logger.error("Groq plan generation failed", { attempt, error: String(error) });
      }
    }
    return { ...formulaPlan(input), source: "formula" };
  }, "run")
});
export {
  generatePlan
};
//# sourceMappingURL=generate-plan.mjs.map
