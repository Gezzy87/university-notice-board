import { MOCK_FEED, type EventItem, type NoticeItem } from "./mock";

export type Attachment = {
  id: string;
  filename: string;
  size: string;
  url: string;
};

export type Comment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type NoticeDetail = NoticeItem & {
  expiresAt?: string;
  attachments: Attachment[];
  comments: Comment[];
};

export type EventDetail = EventItem & {
  description: string;
  endsAt: string;
  attachments: Attachment[];
  comments: Comment[];
};

const SAMPLE_ATTACHMENTS: Attachment[] = [
  { id: "a1", filename: "exam-timetable.pdf", size: "412 KB", url: "#" },
  { id: "a2", filename: "seating-plan.pdf", size: "1.2 MB", url: "#" },
];

const SAMPLE_COMMENTS: Comment[] = [
  {
    id: "c1",
    author: "Priya Sharma",
    body: "Is the room allocation final, or could it still change?",
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: "c2",
    author: "Alex Rivera",
    body: "Thanks for posting — really helpful ahead of finals.",
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
  },
];

export function getNoticeDetail(id: string): NoticeDetail | null {
  const item = MOCK_FEED.find((f) => f.id === id && f.kind === "notice") as
    | NoticeItem
    | undefined;
  if (!item) return null;
  return {
    ...item,
    body: `${item.body} Please make sure to review the attached documents and reach out to the relevant office if you have questions. This notice remains in effect until further notice.`,
    expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    attachments: item.category === "Exams" ? SAMPLE_ATTACHMENTS : [],
    comments: SAMPLE_COMMENTS,
  };
}

export function getEventDetail(id: string): EventDetail | null {
  const item = MOCK_FEED.find((f) => f.id === id && f.kind === "event") as
    | EventItem
    | undefined;
  if (!item) return null;
  const start = new Date(item.startsAt);
  return {
    ...item,
    description:
      "Join us for this session, followed by an open Q&A. All students are welcome — no prior registration required beyond your RSVP. Refreshments will be provided.",
    endsAt: new Date(start.getTime() + 2 * 3600_000).toISOString(),
    attachments: [
      { id: "e-a1", filename: "event-details.pdf", size: "220 KB", url: "#" },
    ],
    comments: SAMPLE_COMMENTS.slice(0, 1),
  };
}
