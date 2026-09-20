import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QRDisplayClient } from "./client";

export default async function QRDisplayPage({ params }: { params: { sessionId: string } }) {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  if (!context.roles.includes("FACULTY") && !context.roles.includes("SUPER_ADMIN") && !context.roles.includes("COLLEGE_ADMIN")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { data: session } = await supabase
    .from("attendance_sessions")
    .select(`
      id,
      date,
      start_time,
      subjects (name),
      sections (name)
    `)
    .eq("id", params.sessionId)
    .single();

  if (!session) {
    return <div>Session not found</div>;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedSession = session as any;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight mb-2">{typedSession.subjects?.name}</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Section {typedSession.sections?.name} • {typedSession.date} • {typedSession.start_time}
      </p>
      
      <QRDisplayClient sessionId={session.id} />
    </div>
  );
}
