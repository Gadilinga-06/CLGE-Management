/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { addBook, updateBook, deleteBook } from "../actions";
import { Search, Plus, Trash2, BookOpen, Edit2 } from "lucide-react";

const BOOK_CATEGORIES = ["FICTION", "NON-FICTION", "TEXTBOOK", "REFERENCE", "SCIENCE", "TECHNOLOGY", "HISTORY", "BIOGRAPHY", "JOURNAL", "OTHER"];

export function BooksClient({ books, categories, isLibrarian, collegeId, initialSearch, initialCategory }: {
  books: any[];
  categories: string[];
  isLibrarian: boolean;
  collegeId: string;
  initialSearch: string;
  initialCategory: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [catFilter, setCatFilter] = useState(initialCategory);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editBook, setEditBook] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (catFilter) params.set("category", catFilter);
    startTransition(() => router.push(`/library/books?${params.toString()}`));
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = await addBook(fd);
    if (result?.error) toast.error(result.error);
    else { toast.success("Book added to catalog!"); setShowAddDialog(false); }
    setIsSubmitting(false);
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateBook(editBook.id, fd);
    if (result?.error) toast.error(result.error);
    else { toast.success("Book updated!"); setEditBook(null); }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" from the catalog? This cannot be undone.`)) return;
    const result = await deleteBook(id);
    if (result?.error) toast.error(result.error);
    else toast.success("Book deleted.");
  };

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>Search</Label>
              <div className="flex gap-2">
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Title, author, or ISBN..."
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <div className="w-[180px] space-y-2">
              <Label>Category</Label>
              <Select value={catFilter} onValueChange={(v) => setCatFilter(v === "ALL" ? "" : (v ?? ""))}>
                <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {[...new Set([...BOOK_CATEGORIES, ...categories])].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} disabled={isPending}>
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
            {isLibrarian && (
              <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Book
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Edition</TableHead>
                <TableHead className="text-center">Copies</TableHead>
                <TableHead className="text-center">Available</TableHead>
                {isLibrarian && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.map(book => {
                const available = (book.book_copies || []).filter((c: any) => c.status === "AVAILABLE").length;
                const total = (book.book_copies || []).length;
                return (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium max-w-[200px]">
                      <div className="truncate">{book.title}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{book.author || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{book.isbn || "—"}</TableCell>
                    <TableCell>
                      {book.category && <Badge variant="outline" className="text-xs">{book.category}</Badge>}
                    </TableCell>
                    <TableCell className="text-sm">{book.edition || "—"}</TableCell>
                    <TableCell className="text-center">{total}</TableCell>
                    <TableCell className="text-center">
                      <span className={available === 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>{available}</span>
                    </TableCell>
                    {isLibrarian && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditBook(book)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDelete(book.id, book.title)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {books.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isLibrarian ? 8 : 7} className="text-center py-12">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground">No books found. {isLibrarian && "Add some to get started."}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Book Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Book to Catalog</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd}>
            <BookFormContent />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Add Book</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={!!editBook} onOpenChange={open => !open && setEditBook(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Book</DialogTitle></DialogHeader>
          {editBook && (
            <form onSubmit={handleEdit}>
              <BookFormContent defaultValues={editBook} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditBook(null)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookFormContent({ defaultValues }: { defaultValues?: any }) {
  return (
    <div className="grid grid-cols-2 gap-4 py-4">
      <div className="col-span-2 space-y-2">
        <Label>Title *</Label>
        <Input name="title" required placeholder="Book title" defaultValue={defaultValues?.title} />
      </div>
      <div className="space-y-2">
        <Label>Author</Label>
        <Input name="author" placeholder="Author name" defaultValue={defaultValues?.author} />
      </div>
      <div className="space-y-2">
        <Label>ISBN</Label>
        <Input name="isbn" placeholder="978-..." defaultValue={defaultValues?.isbn} />
      </div>
      <div className="space-y-2">
        <Label>Publisher</Label>
        <Input name="publisher" placeholder="Publisher" defaultValue={defaultValues?.publisher} />
      </div>
      <div className="space-y-2">
        <Label>Edition</Label>
        <Input name="edition" placeholder="e.g. 5th" defaultValue={defaultValues?.edition} />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select name="category" defaultValue={defaultValues?.category || ""}>
          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            {BOOK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {!defaultValues && (
        <div className="space-y-2">
          <Label>Number of Copies *</Label>
          <Input name="total_copies" type="number" min="1" defaultValue="1" required />
        </div>
      )}
    </div>
  );
}
