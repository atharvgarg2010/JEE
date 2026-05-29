import { getPool } from "@/lib/db/postgres";
import type { Subject, Chapter } from "@/types/modules";

// ============================================================
// SUBJECTS
// ============================================================

export async function listSubjects(): Promise<Subject[]> {
  const pool = getPool();
  const { rows } = await pool.query<Subject>(
    `SELECT id, name, created_at FROM subjects ORDER BY name ASC`
  );
  return rows;
}

// ============================================================
// CHAPTERS
// ============================================================

export async function listChapters(subjectId?: string): Promise<Chapter[]> {
  const pool = getPool();
  
  if (subjectId) {
    const { rows } = await pool.query<Chapter>(
      `SELECT c.id, c.subject_id, s.name as subject_name, c.name, c.sort_order, c.created_at
       FROM chapters c
       JOIN subjects s ON s.id = c.subject_id
       WHERE c.subject_id = $1
       ORDER BY c.sort_order ASC, c.name ASC`,
      [subjectId]
    );
    return rows;
  }

  const { rows } = await pool.query<Chapter>(
    `SELECT c.id, c.subject_id, s.name as subject_name, c.name, c.sort_order, c.created_at
     FROM chapters c
     JOIN subjects s ON s.id = c.subject_id
     ORDER BY s.name ASC, c.sort_order ASC, c.name ASC`
  );
  return rows;
}

export async function getChapterById(id: string): Promise<Chapter | null> {
  const pool = getPool();
  const { rows } = await pool.query<Chapter>(
    `SELECT c.id, c.subject_id, s.name as subject_name, c.name, c.sort_order, c.created_at
     FROM chapters c
     JOIN subjects s ON s.id = c.subject_id
     WHERE c.id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function createChapter(input: {
  subject_id: string;
  name: string;
  sort_order?: number;
}): Promise<Chapter> {
  const pool = getPool();
  const order = input.sort_order ?? 0;
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  const { rows } = await pool.query<Chapter>(
    `WITH inserted AS (
       INSERT INTO chapters (subject_id, name, sort_order, slug)
       VALUES ($1, $2, $3, $4)
       RETURNING *
     )
     SELECT i.id, i.subject_id, s.name as subject_name, i.name, i.sort_order, i.created_at
     FROM inserted i
     JOIN subjects s ON s.id = i.subject_id`,
    [input.subject_id, input.name.trim(), order, slug]
  );
  return rows[0];
}

export async function updateChapter(
  id: string,
  input: { name?: string; sort_order?: number }
): Promise<Chapter | null> {
  const pool = getPool();
  
  const updates: string[] = [];
  const params: any[] = [id];
  let paramIndex = 2;
  
  if (input.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    params.push(input.name.trim());
    updates.push(`slug = $${paramIndex++}`);
    params.push(input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  }
  
  if (input.sort_order !== undefined) {
    updates.push(`sort_order = $${paramIndex++}`);
    params.push(input.sort_order);
  }
  
  if (updates.length === 0) {
    return getChapterById(id);
  }
  
  const { rows } = await pool.query<Chapter>(
    `WITH updated AS (
       UPDATE chapters
       SET ${updates.join(", ")}
       WHERE id = $1
       RETURNING *
     )
     SELECT u.id, u.subject_id, s.name as subject_name, u.name, u.sort_order, u.created_at
     FROM updated u
     JOIN subjects s ON s.id = u.subject_id`,
    params
  );
  
  return rows[0] || null;
}

export async function deleteChapter(id: string): Promise<boolean> {
  const pool = getPool();
  
  // Note: we can only delete if no module_sets rely on this chapter_id,
  // because we will add ON DELETE RESTRICT for the fk in module_sets.
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM chapters WHERE id = $1`,
      [id]
    );
    return (rowCount ?? 0) > 0;
  } catch (error: any) {
    // If it violates foreign key constraint 23503, throw a custom message
    if (error.code === '23503') {
      throw new Error("Cannot delete chapter because there are modules linked to it.");
    }
    throw error;
  }
}
