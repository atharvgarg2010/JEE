import { getPool } from "@/lib/db/postgres";
import type { PublicUser, User, UserRole } from "@/types/user";

export interface CreateStudentInput {
  full_name: string;
  username: string;
  roll_number: string;
  batch_code: string;
  password_hash: string;
}

interface UserRow {
  id: string;
  full_name: string | null;
  username: string;
  roll_number: string | null;
  batch_code: string | null;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    full_name: row.full_name,
    username: row.username,
    roll_number: row.roll_number,
    batch_code: row.batch_code,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    roll_number: user.roll_number,
    batch_code: user.batch_code,
    role: user.role,
  };
}

export async function findUserByUsername(
  username: string,
): Promise<User | null> {
  const pool = getPool();
  const { rows } = await pool.query<UserRow>(
    `SELECT id, full_name, username, roll_number, batch_code, password_hash, role, created_at, updated_at
     FROM users WHERE username = $1 LIMIT 1`,
    [username.toLowerCase()],
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findUserByRollNumber(
  rollNumber: string,
): Promise<User | null> {
  const pool = getPool();
  const { rows } = await pool.query<UserRow>(
    `SELECT id, full_name, username, roll_number, batch_code, password_hash, role, created_at, updated_at
     FROM users WHERE roll_number = $1 LIMIT 1`,
    [rollNumber.trim()],
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findUserByIdentifier(
  identifier: string,
): Promise<(User & { password_hash: string }) | null> {
  const trimmed = identifier.trim();
  const pool = getPool();

  const byUsername = await pool.query<UserRow>(
    `SELECT * FROM users WHERE username = $1 LIMIT 1`,
    [trimmed.toLowerCase()],
  );
  if (byUsername.rows[0]) {
    return { ...mapUser(byUsername.rows[0]), password_hash: byUsername.rows[0].password_hash };
  }

  const byRoll = await pool.query<UserRow>(
    `SELECT * FROM users WHERE roll_number = $1 LIMIT 1`,
    [trimmed],
  );
  if (byRoll.rows[0]) {
    return { ...mapUser(byRoll.rows[0]), password_hash: byRoll.rows[0].password_hash };
  }

  return null;
}

export async function findUserWithPasswordByUsername(
  username: string,
  role?: UserRole,
): Promise<(User & { password_hash: string }) | null> {
  const pool = getPool();
  const query = role
    ? `SELECT * FROM users WHERE username = $1 AND role = $2 LIMIT 1`
    : `SELECT * FROM users WHERE username = $1 LIMIT 1`;
  const params = role ? [username.toLowerCase(), role] : [username.toLowerCase()];
  const { rows } = await pool.query<UserRow>(query, params);

  if (!rows[0]) return null;
  return { ...mapUser(rows[0]), password_hash: rows[0].password_hash };
}

export async function createStudent(
  input: CreateStudentInput,
): Promise<User> {
  const pool = getPool();
  const { rows } = await pool.query<UserRow>(
    `INSERT INTO users (full_name, username, roll_number, batch_code, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, 'student')
     RETURNING id, full_name, username, roll_number, batch_code, password_hash, role, created_at, updated_at`,
    [
      input.full_name,
      input.username.toLowerCase(),
      input.roll_number,
      input.batch_code.toUpperCase(),
      input.password_hash,
    ],
  );
  return mapUser(rows[0]);
}

export async function findUserById(id: string): Promise<User | null> {
  const pool = getPool();
  const { rows } = await pool.query<User>(
    `SELECT id, full_name, username, roll_number, batch_code, role, created_at, updated_at
     FROM users WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function usernameExists(username: string): Promise<boolean> {
  const user = await findUserByUsername(username);
  return user !== null;
}

export async function rollNumberExists(rollNumber: string): Promise<boolean> {
  const user = await findUserByRollNumber(rollNumber);
  return user !== null;
}
