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
    options: z
      .union([
        z.array(mcqOptionSchema),
        z.array(z.string().min(1)),
      ])
      .optional()
      .nullable(),
    correctAnswer: z.union([z.string().min(1), z.number()]),
    solution: z.string().min(5, "Solution must be at least 5 characters"),
    tags: z.union([z.array(z.string().min(1)), z.string()])
      .optional()
      .default([]),
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
      const options = Array.isArray(data.options)
        ? data.options.map((option) =>
            typeof option === "string"
              ? { id: option.trim(), text: option.trim() }
              : {
                  id: String(option.id ?? option.text ?? "").trim(),
                  text: String(option.text ?? option.id ?? "").trim(),
                },
          )
        : [];

      if (options.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "MCQ requires at least 2 options",
          path: ["options"],
        });
      } else {
        const normalizedAnswer =
          typeof data.correctAnswer === "number"
            ? String(data.correctAnswer)
            : data.correctAnswer.trim();

        const normalizedLetters = options.map((_, index) =>
          String.fromCharCode(65 + index).
            toUpperCase(),
        );

        const matchesOptionId = options.some(
          (option) => option.id === normalizedAnswer,
        );
        const matchesOptionText = options.some(
          (option) => option.text === normalizedAnswer,
        );
        const matchesLetter = normalizedLetters.includes(
          normalizedAnswer.toUpperCase(),
        );

        if (!matchesOptionId && !matchesOptionText && !matchesLetter) {
          ctx.addIssue({
            code: "custom",
            message:
              "Correct answer must match an option id, option text, or option letter",
            path: ["correctAnswer"],
          });
        }
      }
    }

    if (data.questionType === "integer") {
      if (data.options && Array.isArray(data.options) && data.options.length > 0) {
        ctx.addIssue({
          code: "custom",
          message: "Integer questions must not include options",
          path: ["options"],
        });
      }
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
