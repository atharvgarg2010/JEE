import { z } from "zod";

export const submitAttemptSchema = z.object({
  questionId: z.string().uuid(),
  selectedAnswer: z.string().min(1, "Answer is required"),
  timeTakenSeconds: z.number().int().min(0),
  doubtMarked: z.boolean().optional(),
});

export const updateAttemptSchema = z.object({
  doubtMarked: z.boolean().optional(),
  doubtResolved: z.boolean().optional(),
  savedForRevision: z.boolean().optional(),
  viewSolution: z.boolean().optional(),
  prepareReattempt: z.boolean().optional(),
});

export const notifyTeacherSchema = z.object({
  questionId: z.string().uuid(),
  message: z.string().min(3, "Message is required").max(2000),
});
