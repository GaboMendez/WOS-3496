import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, createGuestToken } from "./src/lib/auth/token";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  // Verify token or create guest token
  let payload;
  if (token) {
    payload = await verifyToken(token);
  }

  // If no valid token, set a guest token
  if (!payload) {
    const guestToken = await createGuestToken();
    const response = NextResponse.next();
    response.cookies.set("auth_token", guestToken, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
