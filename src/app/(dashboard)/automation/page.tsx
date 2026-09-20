/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AutomationClient } from "./client";
import { getRecentAutomationLogs } from "./actions";

export default async function AutomationPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  if (!ctx.roles.includes("SUPER_ADMIN") && !ctx.roles.includes("COLLEGE_ADMIN")) {
    redirect("/unauthorized");
  }

  const recentLogs = await getRecentAutomationLogs();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Automation Engine</h2>
        <p className="text-muted-foreground">
          Manage automated alerts, reminders, and notifications.
        </p>
      </div>
      <AutomationClient recentLogs={recentLogs} />
    </div>
  );
}
