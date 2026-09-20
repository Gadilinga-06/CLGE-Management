import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScanClient } from "./client";

export default async function ScanAttendancePage({ searchParams }: { searchParams: { session?: string, token?: string } }) {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  if (!context.roles.includes("STUDENT")) {
    // Only students can mark attendance this way
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
          <p>Only students can use this link to mark attendance.</p>
        </div>
      </div>
    );
  }

  const { session, token } = searchParams;
  if (!session || !token) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Invalid Link</h1>
          <p>The attendance link is missing required parameters.</p>
        </div>
      </div>
    );
  }

  // Fetch session details to show what they are marking present for
  const supabase = await createClient();
  const { data: sessionData } = await supabase
    .from("attendance_sessions")
    .select("subjects(name), sections(name), date, start_time")
    .eq("id", session)
    .single();

  return (
    <div className="max-w-md mx-auto mt-12">
      <ScanClient sessionId={session} token={token} sessionData={sessionData} />
    </div>
  );
}
