import { z } from "zod";
import { ValidationError } from "./error";

export async function parseRequestBody<T>(
  req: Request,
  schema: z.ZodType<T>,
  maxSize: number = 1048576 // default 1MB limit
): Promise<T> {
  const clonedReq = req.clone();
  const text = await clonedReq.text();
  
  if (text.length > maxSize) {
    throw new ValidationError(`Payload too large. Maximum allowed size is ${maxSize} bytes.`);
  }

  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new ValidationError("Malformed JSON payload");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw parsed.error; // Will be caught and formatted by withApiErrorHandler
  }

  return parsed.data;
}
