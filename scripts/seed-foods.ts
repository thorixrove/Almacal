// Seed: katalog makanan untuk halaman Foods. Aman dijalankan ulang (tabel dikosongkan dulu).
// Run: node --experimental-strip-types scripts/seed-foods.ts
import { neon } from "@neondatabase/serverless";

process.loadEnvFile();
const sql = neon(process.env.DATABASE_URL!);

type Category = "breakfast" | "lunch" | "dinner" | "snacks" | "shakes";

// image: id foto Unsplash (opsional). Yang null akan tampil sebagai placeholder di app —
// isi nanti dengan foto sendiri.
const FOODS: {
  name: string;
  category: Category;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving?: string;
  image?: string;
}[] = [
  // Breakfast
  { name: "Oatmeal with Berries", category: "breakfast", calories: 350, protein: 12, carbs: 58, fat: 8, serving: "1 mangkuk (300 g)" },
  { name: "Peanut Butter Banana Toast", category: "breakfast", calories: 420, protein: 16, carbs: 52, fat: 18, serving: "2 lembar roti" },
  { name: "Greek Yogurt Parfait", category: "breakfast", calories: 420, protein: 28, carbs: 52, fat: 11, serving: "1 gelas (320 g)", image: "photo-1488477181946-6428a0291777" },
  { name: "Avocado Toast with Eggs", category: "breakfast", calories: 520, protein: 24, carbs: 42, fat: 29, serving: "2 lembar roti + 2 telur", image: "photo-1541519227354-08fa5d50c44d" },
  { name: "Nasi Goreng Telur", category: "breakfast", calories: 480, protein: 15, carbs: 68, fat: 16, serving: "1 piring (250 g)" },
  { name: "Scrambled Eggs & Toast", category: "breakfast", calories: 380, protein: 22, carbs: 28, fat: 20, serving: "3 telur + 1 roti" },

  // Lunch
  { name: "Grilled Chicken Bowl", category: "lunch", calories: 550, protein: 40, carbs: 55, fat: 17, serving: "1 mangkuk (400 g)" },
  { name: "Chicken Burrito Bowl", category: "lunch", calories: 780, protein: 52, carbs: 88, fat: 22, serving: "1 mangkuk (500 g)", image: "photo-1512621776951-a57141f2eefd" },
  { name: "Nasi Ayam Bakar", category: "lunch", calories: 620, protein: 38, carbs: 70, fat: 20, serving: "1 porsi" },
  { name: "Tuna Salad Sandwich", category: "lunch", calories: 450, protein: 30, carbs: 40, fat: 18, serving: "1 sandwich" },
  { name: "Gado-gado", category: "lunch", calories: 400, protein: 17, carbs: 38, fat: 20, serving: "1 porsi (350 g)" },

  // Dinner
  { name: "Beef & Potatoes", category: "dinner", calories: 720, protein: 40, carbs: 60, fat: 34, serving: "1 piring (450 g)" },
  { name: "Salmon with Roasted Potatoes", category: "dinner", calories: 690, protein: 45, carbs: 55, fat: 30, serving: "1 piring (420 g)", image: "photo-1467003909585-2f8a72700288" },
  { name: "Beef Pho", category: "dinner", calories: 610, protein: 38, carbs: 72, fat: 18, serving: "1 mangkuk (600 g)", image: "photo-1591814468924-caf88d1232e1" },
  { name: "Ikan Bakar & Nasi", category: "dinner", calories: 540, protein: 42, carbs: 58, fat: 14, serving: "1 porsi" },
  { name: "Soto Ayam", category: "dinner", calories: 430, protein: 28, carbs: 40, fat: 17, serving: "1 mangkuk (400 g)" },

  // Snacks
  { name: "Apple with Almond Butter", category: "snacks", calories: 250, protein: 6, carbs: 30, fat: 14, serving: "1 apel + 2 sdm" },
  { name: "Boiled Eggs", category: "snacks", calories: 155, protein: 13, carbs: 1, fat: 11, serving: "2 butir" },
  { name: "Mixed Nuts", category: "snacks", calories: 280, protein: 8, carbs: 10, fat: 24, serving: "1 genggam (45 g)" },
  { name: "Protein Bar", category: "snacks", calories: 210, protein: 20, carbs: 22, fat: 7, serving: "1 batang" },

  // Shakes
  { name: "Protein Smoothie", category: "shakes", calories: 280, protein: 25, carbs: 32, fat: 5, serving: "1 gelas (400 ml)" },
  { name: "Banana Peanut Shake", category: "shakes", calories: 390, protein: 22, carbs: 44, fat: 14, serving: "1 gelas (450 ml)" },
  { name: "Berry Whey Shake", category: "shakes", calories: 220, protein: 27, carbs: 20, fat: 3, serving: "1 gelas (350 ml)" },
];

await sql`delete from foods`;

for (const f of FOODS) {
  const imageUrl = f.image ? `https://images.unsplash.com/${f.image}` : null;
  await sql`
    insert into foods (name, category, image_url, calories, protein_g, carbs_g, fat_g, serving_note)
    values (${f.name}, ${f.category}, ${imageUrl}, ${f.calories}, ${f.protein}, ${f.carbs}, ${f.fat}, ${f.serving ?? null})
  `;
  console.log(`${f.category.padEnd(9)} ${f.name}`);
}

console.log(`\nSeeded ${FOODS.length} foods`);