import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const { rows: batchCodes } = await client.query(
  `SELECT DISTINCT batch_code FROM users WHERE batch_code IS NOT NULL AND batch_code != ''`
);
console.log("Distinct batch codes in users:", batchCodes);

const { rows: students } = await client.query(
  `SELECT id, username, batch_code FROM users WHERE role = 'student'`
);
console.log("Total students:", students.length);
console.log("Students details:", students);

const { rows: teachers } = await client.query(
  `SELECT id, username, subject, role FROM users WHERE role = 'teacher'`
);
console.log("Total teachers:", teachers.length);
console.log("Teachers details:", teachers);

await client.end();
