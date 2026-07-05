export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };

/** Rough 0–4 password strength score for the register meter. */
export function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score: clamped, label: labels[clamped] };
}

// Allowed university email domains (client-side hint; the server enforces the
// real check via ALLOWED_EMAIL_DOMAINS during the data-wiring pass).
export const ALLOWED_DOMAINS = ["university.edu"];

export function isUniversityEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}
