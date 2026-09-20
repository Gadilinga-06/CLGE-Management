/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MyLibraryClient } from "./client";

export default async function MyLibraryPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const supabase = await createClient();

  // Find member record for this user
  const { data: member } = await supabase
    .from("library_members")
    .select("id, member_type, max_books, status")
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  let transactions: any[] = [];
  let fines: any[] = [];
  let reservations: any[] = [];

  if (member) {
    const [{ data: tx }, { data: fn }, { data: res }] = await Promise.all([
      supabase
        .from("library_transactions")
        .select(`
          id, issue_date, due_date, return_date, status, renewal_count,
          book_copies(accession_number, books(title, author, isbn, category))
        `)
        .eq("member_id", member.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("library_fines")
        .select("id, amount, status, created_at, library_transactions(due_date, book_copies(books(title)))")
        .in(
          "transaction_id",
          (await supabase.from("library_transactions").select("id").eq("member_id", member.id)).data?.map((t: any) => t.id) || []
        ),

      supabase
        .from("book_reservations")
        .select("id, reserved_at, expires_at, status, books(title, author)")
        .eq("member_id", member.id)
        .order("reserved_at", { ascending: false }),
    ]);

    transactions = tx || [];
    fines = fn || [];
    reservations = res || [];
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Library</h2>
        <p className="text-muted-foreground">View your borrowed books, history, and fines.</p>
      </div>
      <MyLibraryClient member={member} transactions={transactions} fines={fines} reservations={reservations} />
    </div>
  );
}
