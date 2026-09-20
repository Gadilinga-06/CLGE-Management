import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyComplaintsClient } from "./client";

export default async function MyComplaintsPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const supabase = await createClient();

  const { data: complaints } = await supabase
    .from("complaints")
    .select(`
      id, requester_id, category, title, description, priority,
      status, assigned_to, resolution_note, attachment_url, created_at, updated_at,
      profiles!complaints_requester_id_fkey(first_name, last_name, email)
    `)
    .eq("requester_id", ctx.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Complaints</h2>
          <p className="text-muted-foreground">View and submit your complaints.</p>
        </div>
      </div>
      <MyComplaintsClient complaints={complaints || []} />
    </div>
  );
}
