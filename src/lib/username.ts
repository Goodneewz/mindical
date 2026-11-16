// Username rules, shared by the sign-up screen (browser) and the server.
// 3-20 characters: letters, numbers, "." and "_", starting and ending with a letter or number.

const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.]{1,18}[A-Za-z0-9]$/;
const RESERVED_PREFIXES = ["admin", "moderator", "support", "mindical", "official", "staff", "system"];

export const USERNAME_HINT = "3–20 characters: letters, numbers, . and _";

export function cleanUsername(raw: string): string {
  return raw.trim();
}

// Returns an error message, or null when the username is acceptable.
export function validateUsername(raw: string): string | null {
  const name = cleanUsername(raw);
  if (!name) return "Choose a username.";
  if (name.length < 3 || name.length > 20) return "Your username must be 3–20 characters.";
  if (/\s/.test(name)) return "Usernames can't contain spaces. Try a . or _ instead.";
  if (!USERNAME_PATTERN.test(name) || !/[A-Za-z]/.test(name)) {
    return "Use letters, numbers, . and _ only, starting and ending with a letter or number, with at least one letter.";
  }
  const squashed = name.toLowerCase().replace(/[._]/g, "");
  if (RESERVED_PREFIXES.some((word) => squashed.startsWith(word))) {
    return "That username isn't available. Please choose another.";
  }
  return null;
}
