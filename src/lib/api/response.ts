import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function jsonSuccess<T extends Record<string, unknown>>(
  data: T,
  status = 200,
) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function zodErrorMessage(error: ZodError): string {
  const first = error.issues[0];
  if (!first) return "Validation failed";
  const field = first.path.map(String).join(".");
  return field ? `${field}: ${first.message}` : first.message;
}
