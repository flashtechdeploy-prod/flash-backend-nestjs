import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: '46.202.194.55',
    port: 5432,
    user: 'postgres',
    password: process.env.DATABASE_PASSWORD || 'c7Od03Arvx4Aix3rl9sxPcFyrJWOZVYW6sakZ00zK54i32bT3eSEgcNPekjom1oe',
    database: 'flash_nest_db',
    ssl: { rejectUnauthorized: false },
  },
});
