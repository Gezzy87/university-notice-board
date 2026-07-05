"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { STORAGE_BUCKET, supabaseAdmin } from "@/lib/storage";
import { rateLimited } from "@/lib/rate-limit";

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// ---------------------------------------------------------------------------
// Image upload (Supabase Storage)
// ---------------------------------------------------------------------------

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function uploadImage(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only" };

  const limited = rateLimited(`upload:${admin.id}`, 20, 5 * 60_000);
  if (limited) return { ok: false, error: limited.error };

  if (!supabaseAdmin)
    return { ok: false, error: "Image uploads aren't configured" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file provided" };
  if (file.size > 5 * 1024 * 1024)
    return { ok: false, error: "Image must be under 5 MB" };
  if (!IMAGE_TYPES.includes(file.type))
    return { ok: false, error: "Use a PNG, JPG, WEBP or GIF" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: error.message };

  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

async function categoryId(name: string): Promise<string | null> {
  const cat = await prisma.category.findUnique({ where: { name } });
  return cat?.id ?? null;
}

// ---------------------------------------------------------------------------
// Notices
// ---------------------------------------------------------------------------

export type NoticeInput = {
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  imageUrl?: string | null;
  publishedAt?: string | null; // ISO; null/undefined => now
  expiresAt?: string | null; // ISO or null
};

export async function createNotice(input: NoticeInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only" };
  if (!input.title.trim()) return { ok: false, error: "Title is required" };

  const catId = await categoryId(input.category);
  if (!catId) return { ok: false, error: "Pick a valid category" };

  const notice = await prisma.notice.create({
    data: {
      title: input.title.trim(),
      body: input.body,
      imageUrl: input.imageUrl || null,
      pinned: input.pinned,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      authorId: admin.id,
      categoryId: catId,
    },
  });

  revalidatePath("/feed");
  revalidatePath("/admin");
  return { ok: true, id: notice.id };
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type EventInput = {
  title: string;
  description: string;
  category: string;
  location: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  capacity?: number | null;
  imageUrl?: string | null;
};

export async function createEvent(input: EventInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only" };
  if (!input.title.trim()) return { ok: false, error: "Title is required" };
  if (!input.location.trim()) return { ok: false, error: "Location is required" };
  if (!input.startsAt || !input.endsAt)
    return { ok: false, error: "Start and end times are required" };
  if (new Date(input.endsAt) < new Date(input.startsAt))
    return { ok: false, error: "End time must be after the start time" };

  const catId = await categoryId(input.category);
  if (!catId) return { ok: false, error: "Pick a valid category" };

  const event = await prisma.event.create({
    data: {
      title: input.title.trim(),
      description: input.description,
      imageUrl: input.imageUrl || null,
      location: input.location.trim(),
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      capacity: input.capacity ?? null,
      organizerId: admin.id,
      categoryId: catId,
    },
  });

  revalidatePath("/feed");
  revalidatePath("/calendar");
  revalidatePath("/admin");
  return { ok: true, id: event.id };
}

// ---------------------------------------------------------------------------
// Delete notice / event
// ---------------------------------------------------------------------------

export async function deleteNotice(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only" };
  await prisma.notice.delete({ where: { id } });
  revalidatePath("/feed");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only" };
  await prisma.event.delete({ where: { id } });
  revalidatePath("/feed");
  revalidatePath("/calendar");
  revalidatePath("/admin");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function createCategory(
  name: string,
  color: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only" };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name is required" };
  const existing = await prisma.category.findUnique({ where: { name: trimmed } });
  if (existing) return { ok: false, error: "That category already exists" };

  await prisma.category.create({ data: { name: trimmed, color } });
  revalidatePath("/admin/categories");
  revalidatePath("/feed");
  return { ok: true };
}

export async function updateCategory(
  id: string,
  color: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only" };
  await prisma.category.update({ where: { id }, data: { color } });
  revalidatePath("/admin/categories");
  revalidatePath("/feed");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only" };
  const inUse = await prisma.notice.count({ where: { categoryId: id } });
  const inUseEvents = await prisma.event.count({ where: { categoryId: id } });
  if (inUse + inUseEvents > 0)
    return { ok: false, error: "This category is in use and can't be deleted" };
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return { ok: true };
}
