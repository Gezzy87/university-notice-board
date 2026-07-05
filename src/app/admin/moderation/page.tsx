import { AdminShell } from "@/components/quad/admin/admin-shell";
import { ModerationView } from "@/components/quad/admin/moderation-view";
import { getModerationComments } from "@/lib/queries";

export default async function AdminModerationPage() {
  const comments = await getModerationComments();
  return (
    <AdminShell>
      <ModerationView comments={comments} />
    </AdminShell>
  );
}
