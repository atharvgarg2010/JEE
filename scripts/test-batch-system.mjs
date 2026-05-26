import pg from "pg";
import { createStudent } from "../src/lib/db/users.js";
import { assignTeacherToBatch, routeDoubtToTeacher } from "../src/lib/db/batches.js";

// Make sure we configure pg connection using process.env
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Since Next.js uses path mapping, we mock the pool for local script testing if needed
// However, our imports in users.js and batches.js use relative paths (like "./postgres" and "./batches")
// which work perfectly when executed in Node because they don't use absolute paths.
// Let's run a test query.

async function runTests() {
  await client.connect();
  console.log("=== BATCH SYSTEM INTEGRATION & ROUTING TESTS ===\n");

  // 1. Fetch a real question to test routing
  const questionRes = await client.query(
    `SELECT q.id, q.teacher_id, q.subject_id, s.name as subject_name
     FROM questions q
     JOIN subjects s ON s.id = q.subject_id
     LIMIT 1`
  );

  if (questionRes.rows.length === 0) {
    console.error("❌ No questions found in the database. Cannot run routing tests.");
    await client.end();
    process.exit(1);
  }

  const testQuestion = questionRes.rows[0];
  console.log(`Using question ID: ${testQuestion.id}`);
  console.log(`Original author (teacher_id): ${testQuestion.teacher_id}`);
  console.log(`Subject: ${testQuestion.subject_name} (ID: ${testQuestion.subject_id})\n`);

  // 2. Fetch a teacher to use for batch mapping (different from original author if possible, or just any teacher)
  const teacherRes = await client.query(
    `SELECT id, username FROM users WHERE role = 'teacher' AND id != $1 LIMIT 1`,
    [testQuestion.teacher_id]
  );
  
  let mappedTeacherId;
  let mappedTeacherUsername;

  if (teacherRes.rows.length > 0) {
    mappedTeacherId = teacherRes.rows[0].id;
    mappedTeacherUsername = teacherRes.rows[0].username;
  } else {
    // If only one teacher exists, use them
    const anyTeacherRes = await client.query(
      `SELECT id, username FROM users WHERE role = 'teacher' LIMIT 1`
    );
    if (anyTeacherRes.rows.length === 0) {
      console.error("❌ No teachers found in the database. Cannot run routing tests.");
      await client.end();
      process.exit(1);
    }
    mappedTeacherId = anyTeacherRes.rows[0].id;
    mappedTeacherUsername = anyTeacherRes.rows[0].username;
  }
  console.log(`Using mapped teacher: ${mappedTeacherUsername} (ID: ${mappedTeacherId})\n`);

  // 3. Test Student Signup & Auto-Enrollment
  console.log("--- Test 1: Student Signup & Auto-Enrollment ---");
  const testUsername = `test_student_${Date.now()}`;
  const testRoll = `ROLL_${Date.now()}`;
  const testBatchCode = `TESTAUTO_${Date.now()}`;

  console.log(`Signing up new student with batch code '${testBatchCode}'...`);
  const student = await createStudent({
    full_name: "Test Student Auto-Enroll",
    username: testUsername,
    roll_number: testRoll,
    batch_code: testBatchCode,
    password_hash: "$2b$12$6K8w3Lz3K8w3Lz3K8w3LzOabcde1234567890abcdef123456789", // mock hash
  });

  console.log(`✅ Student created successfully. ID: ${student.id}`);

  // Verify batch was created
  const batchCheck = await client.query(
    `SELECT * FROM batches WHERE code = $1`,
    [testBatchCode]
  );
  if (batchCheck.rows.length === 1) {
    console.log(`✅ Batch '${testBatchCode}' auto-created successfully! ID: ${batchCheck.rows[0].id}`);
  } else {
    throw new Error(`Batch '${testBatchCode}' was not created!`);
  }
  const testBatchId = batchCheck.rows[0].id;

  // Verify student was enrolled in batch_students
  const enrollmentCheck = await client.query(
    `SELECT * FROM batch_students WHERE student_id = $1 AND batch_id = $2`,
    [student.id, testBatchId]
  );
  if (enrollmentCheck.rows.length === 1) {
    console.log("✅ Student successfully enrolled in batch_students automatically!");
  } else {
    throw new Error("Student was not enrolled in batch_students!");
  }

  // 4. Test Notification Routing Fallback (No batch teacher mapped)
  console.log("\n--- Test 2: Notification Routing Fallback (No batch mapping) ---");
  console.log("Routing doubt for the new student...");
  const routeFallback = await routeDoubtToTeacher(student.id, testQuestion.id);
  console.log(`Routed Teacher ID: ${routeFallback.teacherId}`);
  console.log(`Expected Teacher ID: ${testQuestion.teacher_id} (Original Author)`);
  if (routeFallback.teacherId === testQuestion.teacher_id) {
    console.log("✅ Fallback routing worked perfectly!");
  } else {
    throw new Error("Fallback routing failed!");
  }

  // 5. Test Notification Routing with Batch-Teacher Mapping
  console.log("\n--- Test 3: Notification Routing with Batch-Teacher Mapping ---");
  console.log(`Assigning teacher '${mappedTeacherUsername}' to batch '${testBatchCode}' for subject '${testQuestion.subject_name}'...`);
  await assignTeacherToBatch(testBatchId, mappedTeacherId, testQuestion.subject_id);
  console.log("✅ Teacher assigned successfully!");

  console.log("Routing doubt again...");
  const routeMapped = await routeDoubtToTeacher(student.id, testQuestion.id);
  console.log(`Routed Teacher ID: ${routeMapped.teacherId}`);
  console.log(`Expected Teacher ID: ${mappedTeacherId} (Assigned Batch Teacher)`);
  if (routeMapped.teacherId === mappedTeacherId) {
    console.log("✅ Mapped routing worked perfectly! Doubt routed to the batch-subject teacher.");
  } else {
    throw new Error("Mapped routing failed!");
  }

  // 6. Database Cleanup
  console.log("\n--- Database Cleanup ---");
  console.log("Removing test data...");
  await client.query(`DELETE FROM batch_teachers WHERE batch_id = $1`, [testBatchId]);
  await client.query(`DELETE FROM batch_students WHERE student_id = $1`, [student.id]);
  await client.query(`DELETE FROM users WHERE id = $1`, [student.id]);
  await client.query(`DELETE FROM batches WHERE id = $1`, [testBatchId]);
  console.log("✅ Database successfully cleaned up.");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
}

runTests()
  .catch((err) => {
    console.error("\n❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
