import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

for (const table of ["questions", "question_attempts", "question_categories"]) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
    [table],
  );
  console.log(`\n${table}:`, rows.map((r) => r.column_name).join(", ") || "(missing)");
}

await client.end();
