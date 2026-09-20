/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MembersClient } from "./client";

export default async function LibraryMembersPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");
  const isLibrarian = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "LIBRARIAN"].includes(r));
  if (!isLibrarian) redirect("/unauthorized");

  const supabase = await createClient();

  const [{ data: members }, { data: profiles }] = await Promise.all([
    supabase
      .from("library_members")
      .select(`
        id, member_type, max_books, status, created_at,
        profiles(first_name, last_name, email, avatar_url),
        library_transactions(id, status)
      `)
      .eq("college_id", ctx.profile.college_id)
      .order("created_at", { ascending: false }),

    // Profiles not yet registered as members
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("college_id", ctx.profile.college_id)
      .not("id", "in",
        `(SELECT user_id FROM library_members WHERE college_id = '${ctx.profile.college_id}')`
      )
      .limit(200),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Library Members</h2>
        <p className="text-muted-foreground">Register and manage library member accounts.</p>
      </div>
      <MembersClient members={members || []} profiles={profiles || []} />
    </div>
  );
}
