import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const statements = [
  `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
  `ALTER TABLE public.users DISABLE ROW LEVEL SECURITY`,
];

for (const sql of statements) {
  try {
    await client.query(sql);
    console.log("OK:", sql.slice(0, 60) + "...");
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

await client.end();
console.log("Schema fix complete.");
