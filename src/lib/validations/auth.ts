import { z } from "zod";

export const studentSignupSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30)
      .regex(
        /^[a-z0-9_]+$/,
        "Username can only contain lowercase letters, numbers, and underscores",
      ),
    rollNumber: z
      .string()
      .min(1, "Roll number is required")
      .max(50)
      .regex(/^[A-Za-z0-9-]+$/, "Invalid roll number format"),
    batchCode: z
      .string()
      .min(2, "Batch code must be at least 2 characters")
      .max(20)
      .regex(/^[A-Za-z0-9]+$/, "Batch code must be alphanumeric"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must include uppercase, lowercase, and a number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const studentLoginSchema = z.object({
  identifier: z.string().min(1, "Username or roll number is required"),
  password: z.string().min(1, "Password is required"),
});

export const teacherLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type StudentSignupInput = z.infer<typeof studentSignupSchema>;
export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
export type TeacherLoginInput = z.infer<typeof teacherLoginSchema>;
