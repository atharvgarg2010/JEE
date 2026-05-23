export const MODULE_CATEGORY_SLUGS = [
  "solved-examples",
  "dpp",
  "prabal-jee-main",
  "parikshit-jee-advanced",
  "topic-wise",
  "pw-challengers",
] as const;

export const CREATED_BY_TEACHER_SLUG = "created-by-teacher";

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;

export type SolutionViewContext =
  | "before_solve"
  | "after_wrong"
  | "after_correct"
  | "while_reviewing";
