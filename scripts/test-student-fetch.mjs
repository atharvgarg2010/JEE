import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const student = await client.query(
  `SELECT id FROM users WHERE role = 'student' LIMIT 1`,
);
const sid = student.rows[0]?.id;
if (!sid) {
  console.log("No student user — sign up first");
  process.exit(0);
}

const q = await client.query(
  `SELECT subject_id, chapter_id, category_id FROM questions LIMIT 1`,
);
const { subject_id, chapter_id, category_id } = q.rows[0];

const list = await client.query(
  `SELECT q.id, q.question_text, cat.name as category
   FROM questions q
   JOIN question_categories cat ON cat.id = q.category_id
   WHERE q.subject_id = $1 AND q.chapter_id = $2`,
  [subject_id, chapter_id],
);
console.log("Student:", sid);
console.log("Questions for chapter:", list.rows.length);
list.rows.forEach((r, i) => console.log(`  ${i + 1}. [${r.category}] ${r.question_text.slice(0, 50)}...`));

await client.end();
