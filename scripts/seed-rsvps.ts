import "dotenv/config";
import { prisma } from "../src/lib/prisma";

// Has the demo students RSVP to every event (mostly GOING, some INTERESTED),
// respecting capacity. Idempotent. Run with: npm run seed:rsvps
async function main() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", email: { endsWith: "@university.edu" } },
    select: { id: true, name: true },
  });
  const events = await prisma.event.findMany({
    select: { id: true, title: true, capacity: true },
  });

  let created = 0;
  for (const ev of events) {
    // Current GOING count (real, from DB).
    let going = await prisma.rsvp.count({
      where: { eventId: ev.id, status: "GOING" },
    });

    students.forEach((_, i) => {}); // keep order deterministic below
    let idx = 0;
    for (const s of students) {
      const existing = await prisma.rsvp.findUnique({
        where: { userId_eventId: { userId: s.id, eventId: ev.id } },
      });
      if (existing) {
        idx++;
        continue;
      }
      // ~1 in 4 is only "Interested"; the rest GOING if capacity allows.
      const wantsGoing = idx % 4 !== 3;
      const hasRoom = ev.capacity == null || going < ev.capacity;
      const status = wantsGoing && hasRoom ? "GOING" : "INTERESTED";
      await prisma.rsvp.create({
        data: { userId: s.id, eventId: ev.id, status },
      });
      if (status === "GOING") going++;
      created++;
      idx++;
    }
    console.log(`  ${ev.title}: now ${going} going${ev.capacity ? ` / ${ev.capacity}` : ""}`);
  }
  console.log(`Added ${created} RSVPs from ${students.length} students across ${events.length} events.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
