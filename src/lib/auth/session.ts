import { auth } from "@/lib/auth/server";

// The signed-in user's ID, read from the login cookie by the server. Never trust an ID sent by the browser.
export async function getUserId(): Promise<string | null> {
  try {
    const { data } = await auth.getSession();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}
