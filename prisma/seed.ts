import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Categories with chip colors (Tailwind-friendly hex values).
const CATEGORIES = [
  { name: "Academic", color: "#2563eb" },
  { name: "Exams", color: "#dc2626" },
  { name: "Placements", color: "#16a34a" },
  { name: "Clubs", color: "#9333ea" },
  { name: "Workshops", color: "#ea580c" },
  { name: "Sports", color: "#0891b2" },
  { name: "General", color: "#64748b" },
];

async function main() {
  console.log("Seeding categories...");
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: { color: c.color },
      create: c,
    });
  }

  // A demo admin used as the author of seeded content. This is a content-owner
  // row only — to actually log in as an admin, register through the app and
  // promote your account (see README → "Make yourself an admin").
  console.log("Seeding demo admin...");
  const admin = await prisma.user.upsert({
    where: { email: "seed-admin@university.edu" },
    update: { role: "ADMIN", emailVerified: true },
    create: {
      name: "Notice Board Admin",
      email: "seed-admin@university.edu",
      role: "ADMIN",
      emailVerified: true,
      department: "Administration",
    },
  });

  const academic = await prisma.category.findUniqueOrThrow({ where: { name: "Academic" } });
  const exams = await prisma.category.findUniqueOrThrow({ where: { name: "Exams" } });
  const workshops = await prisma.category.findUniqueOrThrow({ where: { name: "Workshops" } });
  const clubs = await prisma.category.findUniqueOrThrow({ where: { name: "Clubs" } });

  console.log("Seeding sample notices...");
  await prisma.notice.createMany({
    data: [
      {
        title: "Mid-semester exam timetable released",
        body: "<p>The mid-semester examination timetable is now available. Please check your department portal for room allocations.</p>",
        pinned: true,
        authorId: admin.id,
        categoryId: exams.id,
      },
      {
        title: "Library extended hours during exams",
        body: "<p>The central library will remain open until <strong>midnight</strong> throughout the examination period.</p>",
        authorId: admin.id,
        categoryId: academic.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seeding sample events...");
  const now = new Date();
  const inDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
  await prisma.event.createMany({
    data: [
      {
        title: "Intro to Machine Learning Workshop",
        description: "<p>A hands-on workshop covering the fundamentals of ML. Laptops required.</p>",
        location: "Lab 3, CS Building",
        startsAt: inDays(7),
        endsAt: inDays(7),
        capacity: 40,
        organizerId: admin.id,
        categoryId: workshops.id,
      },
      {
        title: "Photography Club Meetup",
        description: "<p>Monthly meetup for the photography club. All skill levels welcome!</p>",
        location: "Student Center, Room 12",
        startsAt: inDays(3),
        endsAt: inDays(3),
        organizerId: admin.id,
        categoryId: clubs.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
