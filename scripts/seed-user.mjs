/**
 * Seed a teacher or admin user into PostgreSQL.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-user.mjs teacher faculty01 SecretPass1
 *   node --env-file=.env.local scripts/seed-user.mjs admin platform_admin SecretPass1
 */
import pg from "pg";
import bcrypt from "bcryptjs";

const { Client } = pg;
const [, , role, username, password, fullName] = process.argv;

if (!role || !username || !password) {
  console.error(
    "Usage: node --env-file=.env.local scripts/seed-user.mjs <teacher|admin> <username> <password> [fullName]",
  );
  process.exit(1);
}

if (!["teacher", "admin"].includes(role)) {
  console.error("Role must be teacher or admin");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set DATABASE_URL in .env.local");
  process.exit(1);
}

const password_hash = await bcrypt.hash(password, 12);
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const { rows } = await client.query(
    `INSERT INTO users (full_name, username, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, role`,
    [fullName ?? username, username.toLowerCase(), password_hash, role],
  );
  console.log("Created user:", rows[0]);
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
