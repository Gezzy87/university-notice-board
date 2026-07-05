import { AdminShell } from "@/components/quad/admin/admin-shell";
import { NoticeForm } from "@/components/quad/admin/notice-form";
import { getCategories } from "@/lib/queries";

export default async function NewNoticePage() {
  const categories = await getCategories();
  return (
    <AdminShell>
      <NoticeForm categories={categories} />
    </AdminShell>
  );
}
