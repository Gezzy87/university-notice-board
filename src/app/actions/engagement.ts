"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { rateLimited } from "@/lib/rate-limit";

type ActionResult = { ok: true } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// RSVP
// ---------------------------------------------------------------------------

export async function setRsvp(
  eventId: string,
  status: "GOING" | "INTERESTED" | null,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in to RSVP" };

  const limited = rateLimited(`rsvp:${user.id}`, 30, 60_000);
  if (limited) return { ok: false, error: limited.error };

  if (status === null) {
    await prisma.rsvp.deleteMany({ where: { userId: user.id, eventId } });
  } else {
    if (status === "GOING") {
      // Enforce capacity (count only GOING, excluding this user's existing RSVP).
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: {
              rsvps: {
                where: { status: "GOING", userId: { not: user.id } },
              },
            },
          },
        },
      });
      if (!event) return { ok: false, error: "Event not found" };
      if (event.capacity != null && event._count.rsvps >= event.capacity) {
        return { ok: false, error: "This event is full" };
      }
    }
    await prisma.rsvp.upsert({
      where: { userId_eventId: { userId: user.id, eventId } },
      update: { status },
      create: { userId: user.id, eventId, status },
    });
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/feed");
  revalidatePath("/my-events");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Bookmark
// ---------------------------------------------------------------------------

export async function toggleBookmark(target: {
  noticeId?: string;
  eventId?: string;
}): Promise<ActionResult & { saved?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in to save items" };

  const limited = rateLimited(`bookmark:${user.id}`, 60, 60_000);
  if (limited) return { ok: false, error: limited.error };

  const { noticeId, eventId } = target;
  if (!noticeId && !eventId) return { ok: false, error: "Nothing to save" };

  const existing = await prisma.bookmark.findFirst({
    where: { userId: user.id, noticeId: noticeId ?? null, eventId: eventId ?? null },
  });

  let saved: boolean;
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    saved = false;
  } else {
    await prisma.bookmark.create({
      data: { userId: user.id, noticeId, eventId },
    });
    saved = true;
  }

  revalidatePath("/saved");
  return { ok: true, saved };
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function addComment(target: {
  noticeId?: string;
  eventId?: string;
  body: string;
}): Promise<ActionResult & { id?: string; author?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in to comment" };

  const limited = rateLimited(`comment:${user.id}`, 5, 60_000);
  if (limited) return { ok: false, error: limited.error };

  const body = target.body.trim();
  if (!body) return { ok: false, error: "Comment is empty" };
  if (body.length > 2000) return { ok: false, error: "Comment is too long" };

  const comment = await prisma.comment.create({
    data: {
      body,
      userId: user.id,
      noticeId: target.noticeId,
      eventId: target.eventId,
    },
  });

  if (target.noticeId) revalidatePath(`/notices/${target.noticeId}`);
  if (target.eventId) revalidatePath(`/events/${target.eventId}`);
  return { ok: true, id: comment.id, author: user.name };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not logged in" };

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return { ok: false, error: "Comment not found" };
  // Authors can delete their own comments; admins can delete any.
  if (comment.userId !== user.id && user.role !== "ADMIN") {
    return { ok: false, error: "Not allowed" };
  }

  await prisma.comment.delete({ where: { id: commentId } });
  if (comment.noticeId) revalidatePath(`/notices/${comment.noticeId}`);
  if (comment.eventId) revalidatePath(`/events/${comment.eventId}`);
  revalidatePath("/admin/moderation");
  return { ok: true };
}
