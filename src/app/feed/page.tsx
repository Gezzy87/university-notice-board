import { Suspense } from "react";
import { AppShell } from "@/components/quad/app-shell";
import { FeedView } from "@/components/quad/feed-view";
import { FeedSkeleton } from "@/components/quad/skeletons";
import { getCategories, getFeedItems } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

async function FeedContent() {
  const user = await getCurrentUser();
  const [items, categories] = await Promise.all([
    getFeedItems(user?.id),
    getCategories(),
  ]);
  return (
    <FeedView items={items} categories={categories} userName={user?.name} />
  );
}

export default function FeedPage() {
  return (
    <AppShell>
      <Suspense fallback={<FeedSkeleton />}>
        <FeedContent />
      </Suspense>
    </AppShell>
  );
}
