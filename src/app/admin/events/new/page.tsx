import { AdminShell } from "@/components/quad/admin/admin-shell";
import { EventForm } from "@/components/quad/admin/event-form";
import { getCategories } from "@/lib/queries";

export default async function NewEventPage() {
  const categories = await getCategories();
  return (
    <AdminShell>
      <EventForm categories={categories} />
    </AdminShell>
  );
}
