import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ComplaintsClient } from "./client";

export default async function ComplaintsPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  if (!ctx.permissions.includes("complaints.view") && !ctx.roles.includes("SUPER_ADMIN")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { data: complaints } = await supabase
    .from("complaints")
    .select(`
      id, requester_id, category, title, description, priority,
      status, assigned_to, resolution_note, attachment_url, college_id, created_at, updated_at,
      profiles!complaints_requester_id_fkey(first_name, last_name, email)
    `)
    .order("created_at", { ascending: false });

  const { data: staffList } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("is_active", true);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Complaints</h2>
          <p className="text-muted-foreground">Manage and resolve complaints.</p>
        </div>
      </div>
      <ComplaintsClient
        complaints={complaints || []}
        staffList={staffList || []}
      />
    </div>
  );
}
