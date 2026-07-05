import { prisma } from "./prisma";
import type { EventItem, FeedItem, NoticeItem } from "./mock";
import type {
  Attachment,
  Comment,
  EventDetail,
  NoticeDetail,
} from "./mock-detail";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function rsvpStatus(s: "GOING" | "INTERESTED" | undefined) {
  if (s === "GOING") return "going" as const;
  if (s === "INTERESTED") return "interested" as const;
  return null;
}

/** All categories (names) for filter chips. */
export async function getCategories(): Promise<string[]> {
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return cats.map((c) => c.name);
}

/** Combined feed: pinned notices first, then upcoming events, then other notices. */
export async function getFeedItems(userId?: string): Promise<FeedItem[]> {
  const [notices, events, userRsvps, userBookmarks] = await Promise.all([
    prisma.notice.findMany({
      include: { category: true, author: true },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    }),
    prisma.event.findMany({
      include: {
        category: true,
        organizer: true,
        _count: { select: { rsvps: { where: { status: "GOING" } } } },
      },
      orderBy: { startsAt: "asc" },
    }),
    userId ? prisma.rsvp.findMany({ where: { userId } }) : Promise.resolve([]),
    userId
      ? prisma.bookmark.findMany({ where: { userId } })
      : Promise.resolve([]),
  ]);

  const rsvpMap = new Map(userRsvps.map((r) => [r.eventId, r.status]));
  const bookmarkedNotices = new Set(
    userBookmarks.filter((b) => b.noticeId).map((b) => b.noticeId),
  );
  const bookmarkedEvents = new Set(
    userBookmarks.filter((b) => b.eventId).map((b) => b.eventId),
  );

  const noticeItems: NoticeItem[] = notices.map((n) => ({
    kind: "notice",
    id: n.id,
    title: n.title,
    body: n.body,
    category: n.category.name,
    pinned: n.pinned,
    author: n.author.name,
    publishedAt: n.publishedAt.toISOString(),
    imageUrl: n.imageUrl,
    bookmarked: bookmarkedNotices.has(n.id),
  }));

  const eventItems: EventItem[] = events.map((e) => ({
    kind: "event",
    id: e.id,
    title: e.title,
    category: e.category.name,
    location: e.location,
    startsAt: e.startsAt.toISOString(),
    capacity: e.capacity,
    spotsTaken: e._count.rsvps,
    organizer: e.organizer.name,
    rsvp: rsvpStatus(rsvpMap.get(e.id)),
    imageUrl: e.imageUrl,
    bookmarked: bookmarkedEvents.has(e.id),
  }));

  const pinned = noticeItems.filter((n) => n.pinned);
  const other = noticeItems.filter((n) => !n.pinned);
  return [...pinned, ...eventItems, ...other];
}

/** Events only (for the calendar). */
export async function getCalendarItems(): Promise<FeedItem[]> {
  const events = await prisma.event.findMany({
    include: {
      category: true,
      organizer: true,
      _count: { select: { rsvps: { where: { status: "GOING" } } } },
    },
    orderBy: { startsAt: "asc" },
  });
  return events.map((e) => ({
    kind: "event",
    id: e.id,
    title: e.title,
    category: e.category.name,
    location: e.location,
    startsAt: e.startsAt.toISOString(),
    capacity: e.capacity,
    spotsTaken: e._count.rsvps,
    organizer: e.organizer.name,
    rsvp: null,
    imageUrl: e.imageUrl,
  }));
}

/** The user's bookmarked notices + events, newest bookmark first. */
export async function getSavedItems(userId: string): Promise<FeedItem[]> {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      notice: { include: { category: true, author: true } },
      event: {
        include: {
          category: true,
          organizer: true,
          _count: { select: { rsvps: { where: { status: "GOING" } } } },
        },
      },
    },
  });

  const rsvps = await prisma.rsvp.findMany({ where: { userId } });
  const rsvpMap = new Map(rsvps.map((r) => [r.eventId, r.status]));

  const items: FeedItem[] = [];
  for (const b of bookmarks) {
    if (b.notice) {
      items.push({
        kind: "notice",
        id: b.notice.id,
        title: b.notice.title,
        body: b.notice.body,
        category: b.notice.category.name,
        pinned: b.notice.pinned,
        author: b.notice.author.name,
        publishedAt: b.notice.publishedAt.toISOString(),
        imageUrl: b.notice.imageUrl,
        bookmarked: true,
      });
    } else if (b.event) {
      items.push({
        kind: "event",
        id: b.event.id,
        title: b.event.title,
        category: b.event.category.name,
        location: b.event.location,
        startsAt: b.event.startsAt.toISOString(),
        capacity: b.event.capacity,
        spotsTaken: b.event._count.rsvps,
        organizer: b.event.organizer.name,
        rsvp: rsvpStatus(rsvpMap.get(b.event.id)),
        imageUrl: b.event.imageUrl,
        bookmarked: true,
      });
    }
  }
  return items;
}

export type MyEventRow = {
  id: string;
  title: string;
  location: string;
  when: string; // ISO
  status: "going" | "interested" | "attended";
};

/** The user's RSVP'd events, split into upcoming and past. */
export async function getMyEvents(
  userId: string,
): Promise<{ upcoming: MyEventRow[]; past: MyEventRow[] }> {
  const rsvps = await prisma.rsvp.findMany({
    where: { userId },
    include: { event: true },
    orderBy: { event: { startsAt: "asc" } },
  });

  const now = new Date();
  const upcoming: MyEventRow[] = [];
  const past: MyEventRow[] = [];
  for (const r of rsvps) {
    const row: MyEventRow = {
      id: r.event.id,
      title: r.event.title,
      location: r.event.location,
      when: r.event.startsAt.toISOString(),
      status:
        r.event.endsAt < now
          ? "attended"
          : r.status === "GOING"
            ? "going"
            : "interested",
    };
    (r.event.endsAt < now ? past : upcoming).push(row);
  }
  past.reverse(); // most recent past first
  return { upcoming, past };
}

function mapComments(
  comments: { id: string; body: string; createdAt: Date; user: { name: string } }[],
): Comment[] {
  return comments.map((c) => ({
    id: c.id,
    author: c.user.name,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
  }));
}

function mapAttachments(
  atts: { id: string; filename: string; size: number; url: string }[],
): Attachment[] {
  return atts.map((a) => ({
    id: a.id,
    filename: a.filename,
    size: formatSize(a.size),
    url: a.url,
  }));
}

// ---------------------------------------------------------------------------
// Admin dashboard
// ---------------------------------------------------------------------------

export async function getDashboardData() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const [
    totalNotices,
    upcomingEvents,
    totalStudents,
    rsvpsThisWeek,
    eventRows,
  ] = await Promise.all([
    prisma.notice.count(),
    prisma.event.count({ where: { startsAt: { gte: now } } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.rsvp.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.event.findMany({
      orderBy: { startsAt: "asc" },
      take: 8,
      include: {
        _count: { select: { rsvps: { where: { status: "GOING" } } } },
      },
    }),
  ]);

  return {
    stats: {
      totalNotices,
      upcomingEvents,
      totalStudents,
      rsvpsThisWeek,
    },
    events: eventRows.map((e) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      going: e._count.rsvps,
      capacity: e.capacity,
    })),
  };
}

/** Recent comments for moderation. */
export async function getModerationComments() {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: true,
      notice: { select: { title: true } },
      event: { select: { title: true } },
    },
  });
  return comments.map((c) => ({
    id: c.id,
    author: c.user.name,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    on: c.notice?.title ?? c.event?.title ?? "a post",
  }));
}

/** Categories with post counts for the manage-categories screen. */
export async function getCategoriesWithCounts() {
  const cats = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { notices: true, events: true } },
    },
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    count: c._count.notices + c._count.events,
  }));
}

export async function getNoticeById(
  id: string,
  userId?: string,
): Promise<NoticeDetail | null> {
  const n = await prisma.notice.findUnique({
    where: { id },
    include: {
      category: true,
      author: true,
      attachments: true,
      comments: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!n) return null;

  const bookmark = userId
    ? await prisma.bookmark.findFirst({ where: { userId, noticeId: id } })
    : null;

  return {
    bookmarked: !!bookmark,
    kind: "notice",
    id: n.id,
    title: n.title,
    body: n.body,
    category: n.category.name,
    pinned: n.pinned,
    author: n.author.name,
    publishedAt: n.publishedAt.toISOString(),
    expiresAt: n.expiresAt?.toISOString(),
    attachments: mapAttachments(n.attachments),
    comments: mapComments(n.comments),
  };
}

export async function getEventById(
  id: string,
  userId?: string,
): Promise<EventDetail | null> {
  const e = await prisma.event.findUnique({
    where: { id },
    include: {
      category: true,
      organizer: true,
      attachments: true,
      comments: { include: { user: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { rsvps: { where: { status: "GOING" } } } },
    },
  });
  if (!e) return null;

  const [myRsvp, bookmark] = await Promise.all([
    userId
      ? prisma.rsvp.findUnique({
          where: { userId_eventId: { userId, eventId: id } },
        })
      : Promise.resolve(null),
    userId
      ? prisma.bookmark.findFirst({ where: { userId, eventId: id } })
      : Promise.resolve(null),
  ]);

  return {
    bookmarked: !!bookmark,
    kind: "event",
    id: e.id,
    title: e.title,
    category: e.category.name,
    location: e.location,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    capacity: e.capacity,
    spotsTaken: e._count.rsvps,
    organizer: e.organizer.name,
    rsvp: rsvpStatus(myRsvp?.status),
    description: e.description,
    attachments: mapAttachments(e.attachments),
    comments: mapComments(e.comments),
  };
}
