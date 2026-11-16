import { redirect } from "next/navigation";

// The sign-in screen lives on the home page. If a Google sign-in can't be finished,
// the auth middleware sends people here, and this sends them on to the home page.
export default function SignInRedirect() {
  redirect("/");
}