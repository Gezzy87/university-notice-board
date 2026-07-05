import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

// Creates (or updates) an admin login.
// Run with: npm run admin:create   (set ADMIN_EMAIL / ADMIN_PASSWORD to override)
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@university.edu";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin123!";
const NAME = process.env.ADMIN_NAME ?? "Admin User";

async function main() {
  // Never allow the weak default password in production.
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
    console.error(
      "Refusing to run in production without ADMIN_PASSWORD set. " +
        "Set a strong ADMIN_PASSWORD env var and re-run.",
    );
    process.exit(1);
  }

  const ctx = await auth.$context;
  const hashed = await ctx.password.hash(PASSWORD);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { role: "ADMIN", emailVerified: true, name: NAME },
    create: {
      email: EMAIL,
      name: NAME,
      role: "ADMIN",
      emailVerified: true,
      department: "Administration",
    },
  });

  // Ensure a credential account exists with the password set.
  const existing = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });
  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: { password: hashed },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: hashed,
      },
    });
  }

  console.log("Admin ready:");
  console.log("  email:   ", EMAIL);
  console.log("  password:", PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
