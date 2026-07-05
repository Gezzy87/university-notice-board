import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/quad/app-shell";
import { SavedView } from "@/components/quad/saved-view";
import { ListSkeleton } from "@/components/quad/skeletons";
import { getSavedItems } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

async function SavedContent({ userId }: { userId: string }) {
  const items = await getSavedItems(userId);
  return <SavedView items={items} />;
}

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <AppShell>
      <Suspense fallback={<ListSkeleton />}>
        <SavedContent userId={user.id} />
      </Suspense>
    </AppShell>
  );
}
