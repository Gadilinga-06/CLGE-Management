import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HelpDeskClient } from "./client";

export default async function HelpDeskPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select(`
      id, requester_id, issue_type, title, description, priority,
      status, assigned_to, resolution_note, ticket_number, category, college_id, created_at, updated_at,
      profiles!support_tickets_requester_id_fkey(first_name, last_name, email)
    `)
    .order("created_at", { ascending: false });

  const { data: staffList } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("is_active", true);

  const ticketIds = (tickets || []).map((t: { id: string }) => t.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let activities: any[] = [];
  if (ticketIds.length > 0) {
    const { data } = await supabase
      .from("ticket_activity")
      .select(`
        id, ticket_id, user_id, action, message, created_at,
        profiles!ticket_activity_user_id_fkey(first_name, last_name)
      `)
      .in("ticket_id", ticketIds)
      .order("created_at", { ascending: true });
    activities = data || [];
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Help Desk</h2>
          <p className="text-muted-foreground">Manage and resolve support tickets.</p>
        </div>
      </div>
      <HelpDeskClient
        tickets={tickets || []}
        staffList={staffList || []}
        activities={activities}
      />
    </div>
  );
}
