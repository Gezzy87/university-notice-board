// Server-side authoritative check for allowed registration email domains.
// Configured via ALLOWED_EMAIL_DOMAINS (comma-separated). If unset/empty, no
// restriction is applied.
export function allowedEmailDomains(): string[] {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(email: string): boolean {
  const domains = allowedEmailDomains();
  if (domains.length === 0) return true; // no restriction configured
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return domains.includes(domain);
}
