/**
 * Applies SQL migration files in supabase/migrations/
 * Usage: node --env-file=.env.local scripts/run-migration.mjs [filename]
 * Default: runs all .sql files in order
 */
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing in .env.local");
  process.exit(1);
}

const targetFile = process.argv[2];
const files = targetFile
  ? [targetFile]
  : readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  for (const file of files) {
    const sqlPath = join(migrationsDir, file);
    const sql = readFileSync(sqlPath, "utf8");
    console.log(`Running ${file}...`);
    await client.query(sql);
    console.log(`✓ ${file}`);
  }
  console.log("All migrations applied.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
