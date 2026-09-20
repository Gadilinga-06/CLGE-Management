/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TransactionsClient } from "./client";

export default async function TransactionsPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const isLibrarian = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "LIBRARIAN"].includes(r));
  if (!isLibrarian) redirect("/unauthorized");

  const supabase = await createClient();

  const [
    { data: transactions },
    { data: members },
    { data: availableCopies },
    { data: fines },
  ] = await Promise.all([
    supabase
      .from("library_transactions")
      .select(`
        id, issue_date, due_date, return_date, status, renewal_count, notes,
        library_members(id, user_id, profiles(first_name, last_name, email)),
        book_copies(id, accession_number, books(title, author, isbn))
      `)
      .eq("college_id", ctx.profile.college_id)
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("library_members")
      .select("id, member_type, profiles(first_name, last_name)")
      .eq("college_id", ctx.profile.college_id)
      .eq("status", "ACTIVE"),

    supabase
      .from("book_copies")
      .select("id, accession_number, books(id, title, author, isbn)")
      .eq("status", "AVAILABLE"),

    supabase
      .from("library_fines")
      .select(`
        id, amount, status, created_at,
        library_transactions(
          id,
          library_members(profiles(first_name, last_name)),
          book_copies(books(title))
        )
      `)
      .eq("college_id", ctx.profile.college_id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Book Circulation</h2>
        <p className="text-muted-foreground">Issue, return, renew books and manage fines.</p>
      </div>
      <TransactionsClient
        transactions={transactions || []}
        members={members || []}
        availableCopies={availableCopies || []}
        fines={fines || []}
        collegeId={ctx.profile.college_id}
      />
    </div>
  );
}
