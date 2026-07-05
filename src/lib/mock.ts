// Temporary mock data so screens render before the database is wired up.
// Replace these with Prisma queries once DATABASE_URL is configured.

export type NoticeItem = {
  kind: "notice";
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  author: string;
  publishedAt: string; // ISO
  imageUrl?: string | null;
  bookmarked?: boolean;
};

export type EventItem = {
  kind: "event";
  id: string;
  title: string;
  category: string;
  location: string;
  startsAt: string; // ISO
  capacity: number | null;
  spotsTaken: number;
  organizer: string;
  rsvp?: "going" | "interested" | null;
  imageUrl?: string | null;
  bookmarked?: boolean;
};

export type FeedItem = NoticeItem | EventItem;

const days = (n: number) =>
  new Date(Date.now() + n * 86400000).toISOString();

export const MOCK_FEED: FeedItem[] = [
  {
    kind: "notice",
    id: "n1",
    title: "Mid-semester exam timetable released",
    body: "The mid-semester examination timetable is now available. Check your department portal for room allocations.",
    category: "Exams",
    pinned: true,
    author: "Registrar",
    publishedAt: days(-1),
  },
  {
    kind: "event",
    id: "e1",
    title: "Guest Lecture: AI & the Future of Work",
    category: "Workshops",
    location: "Auditorium B",
    startsAt: days(3),
    capacity: 120,
    spotsTaken: 88,
    organizer: "CS Department",
    rsvp: null,
  },
  {
    kind: "notice",
    id: "n2",
    title: "Library extended hours during exams",
    body: "The central library will remain open until midnight throughout the examination period.",
    category: "Academic",
    pinned: false,
    author: "Library Services",
    publishedAt: days(-2),
  },
  {
    kind: "event",
    id: "e2",
    title: "Photography Club Meetup",
    category: "Clubs",
    location: "Student Center, Room 12",
    startsAt: days(5),
    capacity: 30,
    spotsTaken: 30,
    organizer: "Photography Club",
    rsvp: null,
  },
  {
    kind: "event",
    id: "e3",
    title: "Intro to Machine Learning Workshop",
    category: "Workshops",
    location: "Lab 3, CS Building",
    startsAt: days(7),
    capacity: 40,
    spotsTaken: 12,
    organizer: "CS Department",
    rsvp: "going",
  },
  {
    kind: "notice",
    id: "n3",
    title: "Placement drive: register by Friday",
    body: "Final-year students must register for the upcoming placement drive on the careers portal by end of week.",
    category: "Placements",
    pinned: false,
    author: "Careers Office",
    publishedAt: days(-3),
  },
];

export const MOCK_CATEGORIES = [
  "Academic",
  "Exams",
  "Placements",
  "Sports",
  "Clubs",
  "Workshops",
  "General",
];
