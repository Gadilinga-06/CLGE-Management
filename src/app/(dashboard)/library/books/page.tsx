/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BooksClient } from "./client";

export default async function BooksPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const supabase = await createClient();
  const { q, category } = await searchParams;

  let query = supabase
    .from("books")
    .select(`
      id, title, author, isbn, publisher, category, edition, total_copies, created_at,
      book_copies(id, status)
    `)
    .eq("college_id", ctx.profile.college_id)
    .order("title");

  if (q) query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%,isbn.ilike.%${q}%`);
  if (category) query = query.eq("category", category);

  const { data: books } = await query;

  // Get distinct categories
  const { data: categories } = await supabase
    .from("books")
    .select("category")
    .eq("college_id", ctx.profile.college_id)
    .not("category", "is", null);

  const distinctCategories = [...new Set((categories || []).map((c: any) => c.category).filter(Boolean))];

  const isLibrarian = ctx.roles.some(r => ["SUPER_ADMIN", "COLLEGE_ADMIN", "LIBRARIAN"].includes(r));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Book Catalog</h2>
        <p className="text-muted-foreground">Search and manage the library collection.</p>
      </div>
      <BooksClient
        books={books || []}
        categories={distinctCategories}
        isLibrarian={isLibrarian}
        collegeId={ctx.profile.college_id}
        initialSearch={q || ""}
        initialCategory={category || ""}
      />
    </div>
  );
}
