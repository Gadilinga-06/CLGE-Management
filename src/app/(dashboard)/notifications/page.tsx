import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NotificationsClient } from "./client";

export default async function NotificationsPage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, type, is_read, link, category, created_at")
    .eq("user_id", context.user.id)
    .order("created_at", { ascending: false });

  const unreadCount = (notifications || []).filter((n: { is_read: boolean }) => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
      </div>
      <NotificationsClient
        notifications={notifications || []}
        userId={context.user.id}
      />
    </div>
  );
}
