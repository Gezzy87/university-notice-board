import { AdminShell } from "@/components/quad/admin/admin-shell";
import { CategoriesManager } from "@/components/quad/admin/categories-manager";
import { getCategoriesWithCounts } from "@/lib/queries";

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesWithCounts();
  return (
    <AdminShell>
      <CategoriesManager initial={categories} />
    </AdminShell>
  );
}
