import { Suspense } from "react";
import { AppShell } from "@/components/quad/app-shell";
import { SearchView } from "@/components/quad/search-view";
import { ListSkeleton } from "@/components/quad/skeletons";
import { getCategories, getFeedItems } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

async function SearchContent() {
  const user = await getCurrentUser();
  const [items, categories] = await Promise.all([
    getFeedItems(user?.id),
    getCategories(),
  ]);
  return <SearchView items={items} categories={categories} />;
}

export default function SearchPage() {
  return (
    <AppShell>
      <Suspense fallback={<ListSkeleton />}>
        <SearchContent />
      </Suspense>
    </AppShell>
  );
}
