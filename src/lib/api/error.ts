import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Validation Error", details?: unknown) {
    super(400, message, details);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends ApiError {
  constructor(message = "Too Many Requests") {
    super(429, message);
    this.name = "RateLimitError";
  }
}

export function zodErrorMessage(error: ZodError): string {
  const first = error.issues[0];
  if (!first) return "Validation failed";
  const field = first.path.map(String).join(".");
  return field ? `${field}: ${first.message}` : first.message;
}

export function jsonError(message: string, status = 400, requestId?: string) {
  return NextResponse.json({ success: false, error: message, requestId }, { status });
}

export function jsonSuccess<T extends Record<string, unknown>>(
  data: T,
  status = 200,
) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export async function withApiErrorHandler(
  handler: (req: Request, ...args: any[]) => Promise<Response>,
  req: Request,
  ...args: any[]
): Promise<Response> {
  const requestId = crypto.randomUUID();
  try {
    return await handler(req, ...args);
  } catch (error: any) {
    // Log the error internally with the requestId
    console.error(`[API Error | Request ID: ${requestId}]`, error);

    if (error instanceof ApiError) {
      return jsonError(error.message, error.statusCode, requestId);
    }

    if (error instanceof ZodError) {
      return jsonError(zodErrorMessage(error), 400, requestId);
    }

    // Postgres constraints or other specific errors
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "23505") { // Unique violation
        return jsonError("A resource with these details already exists.", 409, requestId);
      }
    }

    // Generic 500 error for unknown issues (hides stack traces)
    return jsonError("Internal Server Error", 500, requestId);
  }
}
