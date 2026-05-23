import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const subjects = await client.query(`SELECT id, name, slug FROM subjects`);
console.log("Subjects:", subjects.rows);

for (const sub of subjects.rows) {
  const chapters = await client.query(
    `SELECT id, name, slug FROM chapters WHERE subject_id = $1`,
    [sub.id],
  );
  for (const ch of chapters.rows) {
    const { rows } = await client.query(
      `SELECT COUNT(q.id)::int AS total FROM questions q
       WHERE q.subject_id = $1 AND q.chapter_id = $2`,
      [sub.id, ch.id],
    );
    if (rows[0].total > 0) {
      console.log(`  ${sub.name} / ${ch.name}: ${rows[0].total} questions`);
    }
  }
}

await client.end();
