import { z } from "zod";

const mcqOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Option text is required"),
});

export const createQuestionSchema = z
  .object({
    subjectId: z.string().uuid("Invalid subject"),
    chapterId: z.string().uuid("Invalid chapter"),
    categoryId: z.string().uuid("Invalid category"),
    difficulty: z.enum(["easy", "medium", "hard"]).optional().nullable(),
    questionType: z.enum(["mcq", "integer"]),
    questionText: z.string().min(10, "Question must be at least 10 characters"),
    options: z.array(mcqOptionSchema).optional().nullable(),
    correctAnswer: z.string().min(1, "Correct answer is required"),
    solution: z.string().min(5, "Solution must be at least 5 characters"),
    tags: z.array(z.string().min(1)).max(10).default([]),
    categoryRequiresDifficulty: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.categoryRequiresDifficulty && !data.difficulty) {
      ctx.addIssue({
        code: "custom",
        message: "Difficulty is required for Created by Teacher",
        path: ["difficulty"],
      });
    }

    if (data.questionType === "mcq") {
      if (!data.options || data.options.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "MCQ requires at least 2 options",
          path: ["options"],
        });
      } else if (!data.options.some((o) => o.id === data.correctAnswer)) {
        ctx.addIssue({
          code: "custom",
          message: "Correct answer must match an option",
          path: ["correctAnswer"],
        });
      }
    }

    if (data.questionType === "integer") {
      const num = Number(data.correctAnswer);
      if (Number.isNaN(num)) {
        ctx.addIssue({
          code: "custom",
          message: "Integer answer must be a valid number",
          path: ["correctAnswer"],
        });
      }
    }
  });

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
