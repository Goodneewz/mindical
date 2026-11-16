import { auth } from "@/lib/auth/server";

// Finishes the Google sign-in: when Google sends the player back with a one-time
// token in the address, this swaps it for the login cookie and removes it from the URL.
// loginUrl must NOT be "/" (the package skips the swap on the login page itself).
export default auth.middleware({ loginUrl: "/sign-in" });

export const config = {
  matcher: [{ source: "/:path*", has: [{ type: "query", key: "neon_auth_session_verifier" }] }],
};
