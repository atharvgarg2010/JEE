import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
const { rows } = await client.query(
  `SELECT column_name, data_type FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'users' ORDER BY ordinal_position`,
);
console.log(rows);
await client.end();
