import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * HTTP Basic Auth for the whole app (pages + API) so paid AI/media endpoints
 * cannot be called anonymously.
 *
 * Env:
 *   APP_BASIC_AUTH_USER     (default: "admin")
 *   APP_BASIC_AUTH_PASSWORD (required in production; if unset in dev, auth is skipped)
 */
export function proxy(request: NextRequest) {
  const password = process.env.APP_BASIC_AUTH_PASSWORD;
  const user = process.env.APP_BASIC_AUTH_USER || "admin";

  if (!password) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    // Fail closed in production when not configured.
    return new NextResponse(
      "Auth not configured: set APP_BASIC_AUTH_PASSWORD.",
      {
        status: 503,
      },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    try {
      const decoded = atob(encoded);
      const idx = decoded.indexOf(":");
      if (
        idx !== -1 &&
        safeEqual(decoded.slice(0, idx), user) &&
        safeEqual(decoded.slice(idx + 1), password)
      ) {
        return NextResponse.next();
      }
    } catch {
      // malformed base64 → fall through to 401
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Ecom OS", charset="UTF-8"' },
  });
}

/** Constant-time-ish string compare (avoid early exit on first mismatch). */
function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|generated/).*)"],
};
