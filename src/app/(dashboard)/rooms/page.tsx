import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RoomsClient } from "./client";

export default async function RoomsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  const canManage = context.permissions.includes("settings.manage") || context.roles.includes("SUPER_ADMIN");
  
  if (!canManage && !context.permissions.includes("settings.view")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("college_id", context.profile.college_id)
    .order("building")
    .order("room_number");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rooms</h2>
          <p className="text-muted-foreground">Manage campus infrastructure.</p>
        </div>
      </div>
      <RoomsClient 
        data={rooms || []} 
        canManage={canManage}
      />
    </div>
  );
}
