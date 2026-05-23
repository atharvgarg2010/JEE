import { getPool } from "@/lib/db/postgres";
import {
  CREATED_BY_TEACHER_SLUG,
  DIFFICULTY_LEVELS,
  MODULE_CATEGORY_SLUGS,
} from "@/lib/constants/questions";
import type {
  DifficultyLevel,
  ExplorerChapterNode,
  ExplorerLeaf,
  ExplorerModuleGroup,
  ExplorerSubjectNode,
} from "@/types/questions";

export async function getExplorerTree(
  studentId: string,
): Promise<ExplorerSubjectNode[]> {
  const pool = getPool();

  const { rows: subjects } = await pool.query(
    `SELECT id, name, slug FROM subjects ORDER BY name`,
  );

  const { rows: categories } = await pool.query(
    `SELECT id, name, slug, sort_order FROM question_categories ORDER BY sort_order`,
  );

  const catBySlug = Object.fromEntries(
    categories.map((c) => [c.slug as string, c]),
  );

  const tree: ExplorerSubjectNode[] = [];

  for (const sub of subjects) {
    const { rows: chapters } = await pool.query(
      `SELECT id, name, slug, sort_order FROM chapters
       WHERE subject_id = $1 ORDER BY sort_order`,
      [sub.id],
    );

    const chapterNodes: ExplorerChapterNode[] = [];

    for (const ch of chapters) {
      const moduleItems: ExplorerLeaf[] = [];
      for (const slug of MODULE_CATEGORY_SLUGS) {
        const cat = catBySlug[slug];
        if (!cat) continue;
        const count = await countQuestions(
          pool,
          sub.id as string,
          ch.id as string,
          cat.id as string,
          null,
        );
        moduleItems.push({
          key: `mod-${ch.id}-${cat.id}`,
          label: cat.name as string,
          categoryId: cat.id as string,
          questionCount: count,
        });
      }

      const cbtCat = catBySlug[CREATED_BY_TEACHER_SLUG];
      const cbtItems: ExplorerLeaf[] = [];
      if (cbtCat) {
        for (const diff of DIFFICULTY_LEVELS) {
          const count = await countQuestions(
            pool,
            sub.id as string,
            ch.id as string,
            cbtCat.id as string,
            diff,
          );
          cbtItems.push({
            key: `cbt-${ch.id}-${diff}`,
            label: diff.charAt(0).toUpperCase() + diff.slice(1),
            categoryId: cbtCat.id as string,
            difficulty: diff as DifficultyLevel,
            questionCount: count,
          });
        }
      }

      const chapterTotal =
        moduleItems.reduce((s, i) => s + i.questionCount, 0) +
        cbtItems.reduce((s, i) => s + i.questionCount, 0);

      chapterNodes.push({
        id: ch.id as string,
        name: ch.name as string,
        slug: ch.slug as string,
        questionCount: chapterTotal,
        module: { label: "Module", items: moduleItems },
        createdByTeacher: cbtItems,
      });
    }

    const subjectTotal = chapterNodes.reduce((s, c) => s + c.questionCount, 0);

    tree.push({
      id: sub.id as string,
      name: sub.name as string,
      slug: sub.slug as string,
      questionCount: subjectTotal,
      chapters: chapterNodes,
    });
  }

  return tree;
}

async function countQuestions(
  pool: ReturnType<typeof getPool>,
  subjectId: string,
  chapterId: string,
  categoryId: string,
  difficulty: string | null,
): Promise<number> {
  const params: unknown[] = [subjectId, chapterId, categoryId];
  let diffSql = "";
  if (difficulty) {
    diffSql = ` AND q.difficulty = $4`;
    params.push(difficulty);
  }
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM questions q
     WHERE q.subject_id = $1 AND q.chapter_id = $2 AND q.category_id = $3${diffSql}`,
    params,
  );
  return rows[0].c as number;
}

export interface ExplorerBucketParams {
  subjectId: string;
  chapterId: string;
  categoryId: string;
  difficulty?: DifficultyLevel;
}
