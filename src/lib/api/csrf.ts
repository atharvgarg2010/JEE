import { ForbiddenError } from "./error";

export function verifyCsrf(req: Request) {
  // Only verify mutations
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return;
  }

  const host = req.headers.get("host");
  const origin = req.headers.get("origin") ?? req.headers.get("referer");

  // If both are missing, it might be a direct API request (e.g. cURL), but since we rely on cookies,
  // legitimate browser requests will always have at least one. We can strictly require it.
  if (!host || !origin) {
    throw new ForbiddenError("Missing Origin or Host header for CSRF protection");
  }

  try {
    const originUrl = new URL(origin);
    const hostUrl = host.includes("://") ? new URL(host) : new URL(`https://${host}`);
    
    // In production, require exact match of hostname
    // Note: port might differ in dev, but hostname should match.
    if (originUrl.hostname !== hostUrl.hostname) {
      console.warn(`CSRF Mismatch: Origin ${originUrl.hostname} vs Host ${hostUrl.hostname}`);
      throw new ForbiddenError("Cross-Site Request Forgery detected");
    }
  } catch (err) {
    if (err instanceof ForbiddenError) throw err;
    throw new ForbiddenError("Invalid Origin or Host header");
  }
}
