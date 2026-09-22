// Cek koneksi ke Neon + kolom tabel `users`, dan cetak PENYEBAB ASLI kalau gagal.
// Jalankan dari root project (Node 20.6+):
//   node --env-file=.env scripts/db-check.mjs
// (ganti .env kalau DATABASE_URL kamu ada di file lain, mis. .env.local)

import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL tidak terbaca. Cek nama file env di perintah --env-file.');
  process.exit(1);
}

// Tampilkan host saja, tanpa user/password
try {
  const u = new URL(url);
  console.log(`Host      : ${u.hostname}`);
  console.log(`Pooler    : ${u.hostname.includes('-pooler') ? 'ya' : 'tidak'}`);
  console.log(`sslmode   : ${u.searchParams.get('sslmode') ?? '(tidak diset)'}`);
} catch {
  console.error('DATABASE_URL bukan URL yang valid.');
  process.exit(1);
}

const sql = neon(url);

/** Ubah error jadi rantai penyebab yang terbaca. */
function describe(err) {
  const chain = [];
  const seen = new Set();
  let e = err;
  while (e && !seen.has(e)) {
    seen.add(e);
    const code = e.code ? ` [code=${e.code}]` : '';
    chain.push(`${e.name ?? 'Error'}: ${e.message}${code}`);
    e = e.cause ?? e.sourceError;
  }
  return chain.join('\n   <- ');
}

// 1) Koneksi + waktu tiap query (3x, untuk lihat cold start / jaringan)
console.log('\n== Tes koneksi (select 1) ==');
for (let i = 1; i <= 3; i++) {
  const t0 = Date.now();
  try {
    await sql`select 1 as ok`;
    console.log(`#${i} OK   ${Date.now() - t0} ms`);
  } catch (err) {
    console.log(`#${i} GAGAL setelah ${Date.now() - t0} ms\n   ${describe(err)}`);
  }
}

// 2) Kolom tabel users vs kolom yang dipakai query di Metro error
console.log('\n== Kolom tabel users ==');
const expected = [
  'id', 'clerk_user_id', 'gender', 'date_of_birth', 'height_cm', 'weight_kg', 'goal',
  'target_weight_kg', 'activity_level', 'pace_kg_per_week', 'diet_preference',
  'unit_preference', 'timezone', 'daily_calories', 'protein_g', 'carbs_g', 'fat_g',
  'plan_rationale', 'plan_generated_at', 'onboarding_completed_at', 'created_at',
];

try {
  const rows = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'users'
  `;
  if (rows.length === 0) {
    console.log('Tabel "users" TIDAK ADA di database ini. Jalankan: npx drizzle-kit push');
  } else {
    const have = new Set(rows.map((r) => r.column_name));
    const missing = expected.filter((c) => !have.has(c));
    console.log(`Ada ${rows.length} kolom.`);
    console.log(
      missing.length
        ? `KOLOM HILANG: ${missing.join(', ')}\n   -> jalankan: npx drizzle-kit push`
        : 'Semua kolom yang dipakai query ada.',
    );
  }
} catch (err) {
  console.log(`Gagal membaca skema:\n   ${describe(err)}`);
}
