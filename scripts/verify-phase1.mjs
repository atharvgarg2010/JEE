import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("=== PHASE 1 VERIFICATION ===\n");

  // Check tables presence
  const tables = ["batches", "batch_students", "batch_teachers", "announcements"];
  for (const table of tables) {
    const { rows: tableCheck } = await client.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
           AND table_name = $1
       )`,
      [table]
    );
    console.log(`Table '${table}' exists:`, tableCheck[0].exists);
  }

  console.log("\n=== ROW COUNTS ===");
  for (const table of tables) {
    const { rows: countRes } = await client.query(`SELECT COUNT(*) FROM "${table}"`);
    console.log(`Table '${table}' count:`, countRes[0].count);
  }

  console.log("\n=== BATCHES DATA ===");
  const { rows: batches } = await client.query(`SELECT * FROM batches`);
  console.log(batches);

  console.log("\n=== BATCH STUDENTS DATA ===");
  const { rows: batchStudents } = await client.query(
    `SELECT bs.batch_id, bs.student_id, u.username, b.code as batch_code 
     FROM batch_students bs
     JOIN users u ON bs.student_id = u.id
     JOIN batches b ON bs.batch_id = b.id`
  );
  console.log(batchStudents);

  console.log("\n=== BATCH TEACHERS DATA (Should be 0 in Phase 1) ===");
  const { rows: batchTeachers } = await client.query(`SELECT * FROM batch_teachers`);
  console.log(batchTeachers);

  console.log("\n=== ANNOUNCEMENTS DATA (Should be 0 in Phase 1) ===");
  const { rows: announcements } = await client.query(`SELECT * FROM announcements`);
  console.log(announcements);

} catch (err) {
  console.error("Verification failed:", err);
} finally {
  await client.end();
}
