import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { SessionPayload, UserRole } from "@/types/user";

const ALGORITHM = "HS256";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({
    username: payload.username,
    role: payload.role,
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALGORITHM],
    });
    return parsePayload(payload);
  } catch {
    return null;
  }
}

function parsePayload(payload: JWTPayload): SessionPayload | null {
  const sub = payload.sub;
  const username = payload.username;
  const role = payload.role;

  if (
    typeof sub !== "string" ||
    typeof username !== "string" ||
    typeof role !== "string" ||
    !["student", "teacher", "admin"].includes(role)
  ) {
    return null;
  }

  return {
    sub,
    username,
    role: role as UserRole,
  };
}
