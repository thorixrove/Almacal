import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  casing: "snake_case",
  tablesFilter: ['users', 'meals', 'foods'],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});