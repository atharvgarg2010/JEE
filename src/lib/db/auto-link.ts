import { getPool } from "@/lib/db/postgres";

export interface AutoLinkPreviewResult {
  matchedCount: number;
  unmatchedCount: number;
  matched: {
    moduleId: string;
    moduleName: string;
    oldSubject: string;
    oldChapter: string;
    newChapterId: string;
    newChapterName: string;
  }[];
  unmatched: {
    moduleId: string;
    moduleName: string;
    oldSubject: string;
    oldChapter: string;
    reason: string;
  }[];
}

export async function previewAutoLink(): Promise<AutoLinkPreviewResult> {
  const pool = getPool();
  
  // 1. Fetch orphan modules
  const { rows: orphans } = await pool.query(
    `SELECT id, subject, chapter, module_name FROM module_sets WHERE chapter_id IS NULL`
  );

  // 2. Fetch all subjects and chapters
  const { rows: subjects } = await pool.query(`SELECT id, name FROM subjects`);
  const { rows: chapters } = await pool.query(`SELECT id, subject_id, name FROM chapters`);

  const result: AutoLinkPreviewResult = {
    matchedCount: 0,
    unmatchedCount: 0,
    matched: [],
    unmatched: []
  };

  for (const mod of orphans) {
    const normSubj = mod.subject.trim().toLowerCase();
    const normChap = mod.chapter.trim().toLowerCase();

    // Find subject
    const subject = subjects.find(s => s.name.trim().toLowerCase() === normSubj);
    
    if (!subject) {
      result.unmatched.push({
        moduleId: mod.id,
        moduleName: mod.module_name,
        oldSubject: mod.subject,
        oldChapter: mod.chapter,
        reason: "Subject not found"
      });
      result.unmatchedCount++;
      continue;
    }

    // Find chapter within subject
    const chapter = chapters.find(
      c => c.subject_id === subject.id && c.name.trim().toLowerCase() === normChap
    );

    if (!chapter) {
      result.unmatched.push({
        moduleId: mod.id,
        moduleName: mod.module_name,
        oldSubject: mod.subject,
        oldChapter: mod.chapter,
        reason: "Chapter not found"
      });
      result.unmatchedCount++;
      continue;
    }

    result.matched.push({
      moduleId: mod.id,
      moduleName: mod.module_name,
      oldSubject: mod.subject,
      oldChapter: mod.chapter,
      newChapterId: chapter.id,
      newChapterName: chapter.name
    });
    result.matchedCount++;
  }

  return result;
}

export async function executeAutoLink(
  matches: { moduleId: string; newChapterId: string }[]
): Promise<number> {
  if (matches.length === 0) return 0;

  const pool = getPool();
  const client = await pool.connect();
  
  let updatedCount = 0;
  try {
    await client.query("BEGIN");
    
    // Batch update isn't strictly necessary for small numbers, but prepared statements in a loop inside a transaction is safe
    for (const match of matches) {
      const { rowCount } = await client.query(
        `UPDATE module_sets SET chapter_id = $1 WHERE id = $2 AND chapter_id IS NULL`,
        [match.newChapterId, match.moduleId]
      );
      if (rowCount && rowCount > 0) updatedCount++;
    }
    
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return updatedCount;
}
