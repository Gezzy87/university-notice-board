import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

// Seeds realistic demo students (login-able) and has each comment on every
// notice and event. Idempotent: re-running won't duplicate users or comments.
// Run with: npm run seed:students
const PASSWORD = process.env.DEMO_STUDENT_PASSWORD ?? "Student123!";

const STUDENTS = [
  { name: "Maya Kapoor", email: "maya.kapoor@university.edu", department: "Computer Science" },
  { name: "Liam O'Connor", email: "liam.oconnor@university.edu", department: "Mechanical Engineering" },
  { name: "Priya Nair", email: "priya.nair@university.edu", department: "Biology" },
  { name: "Daniel Okafor", email: "daniel.okafor@university.edu", department: "Economics" },
  { name: "Sofia Almeida", email: "sofia.almeida@university.edu", department: "Design" },
  { name: "Kenji Tanaka", email: "kenji.tanaka@university.edu", department: "Physics" },
];

const NOTICE_COMMENTS = [
  "Thanks for the heads up!",
  "Good to know — appreciate the update.",
  "Does this apply to the whole campus?",
  "Finally, been waiting for this.",
  "Sharing this with my study group.",
  "Will there be an email reminder too?",
  "Super helpful, thanks!",
  "Noted — thanks for posting.",
  "This is really useful, cheers.",
  "Any idea how long this lasts?",
];

const EVENT_COMMENTS = [
  "Sounds great, I'll be there!",
  "Is registration required or just an RSVP?",
  "Count me in 🙌",
  "Been looking forward to this one.",
  "Can we bring a friend along?",
  "What time do doors open?",
  "Perfect, just RSVP'd.",
  "Will there be refreshments?",
  "Really excited for this!",
  "Hope there are still spots left.",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  const ctx = await auth.$context;
  const hashed = await ctx.password.hash(PASSWORD);

  // 1. Create students (idempotent).
  const students: { id: string }[] = [];
  for (const s of STUDENTS) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { name: s.name, department: s.department, role: "STUDENT" },
      create: {
        name: s.name,
        email: s.email,
        role: "STUDENT",
        emailVerified: true,
        department: s.department,
      },
    });
    const account = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (account) {
      await prisma.account.update({ where: { id: account.id }, data: { password: hashed } });
    } else {
      await prisma.account.create({
        data: { userId: user.id, providerId: "credential", accountId: user.id, password: hashed },
      });
    }
    students.push(user);
  }
  console.log(`Seeded ${students.length} students (password: ${PASSWORD}).`);

  // 2. Every student comments on every notice and event (varied text).
  const notices = await prisma.notice.findMany({ select: { id: true, publishedAt: true } });
  const events = await prisma.event.findMany({ select: { id: true, createdAt: true } });

  let created = 0;
  const now = Date.now();

  async function commentOnPost(
    kind: "notice" | "event",
    postId: string,
    since: number,
    pool: string[],
  ) {
    const texts = shuffle(pool); // distinct text per student on this post
    let i = 0;
    for (const student of students) {
      const where =
        kind === "notice"
          ? { userId: student.id, noticeId: postId }
          : { userId: student.id, eventId: postId };
      const exists = await prisma.comment.findFirst({ where });
      if (exists) {
        i++;
        continue;
      }
      // Spread comment times between the post date and now.
      const at = new Date(since + Math.random() * (now - since));
      await prisma.comment.create({
        data: {
          body: texts[i % texts.length],
          userId: student.id,
          noticeId: kind === "notice" ? postId : undefined,
          eventId: kind === "event" ? postId : undefined,
          createdAt: at,
        },
      });
      created++;
      i++;
    }
  }

  for (const n of notices) {
    await commentOnPost("notice", n.id, n.publishedAt.getTime(), NOTICE_COMMENTS);
  }
  for (const e of events) {
    await commentOnPost("event", e.id, e.createdAt.getTime(), EVENT_COMMENTS);
  }

  console.log(
    `Added ${created} comments across ${notices.length} notices + ${events.length} events.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
