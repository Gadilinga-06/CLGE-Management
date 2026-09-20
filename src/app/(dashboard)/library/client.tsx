/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { returnBook, renewBook, saveFineRule } from "./actions";
import { BookOpen, Users, AlertCircle, RefreshCcw, RotateCcw, ArrowRight } from "lucide-react";
import Link from "next/link";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  RETURNED: "default",
  ISSUED: "secondary",
  OVERDUE: "destructive",
};

export function LibraryDashboardClient({ stats, recentTransactions, fineRule, isLibrarian, collegeId }: {
  stats: { totalBooks: number; totalCopies: number; availableCopies: number; issuedCopies: number; activeMembers: number; overdueCount: number; outstandingFines: number };
  recentTransactions: any[];
  fineRule: any;
  isLibrarian: boolean;
  collegeId: string;
}) {
  const [returnDialog, setReturnDialog] = useState<any>(null);
  const [renewDialog, setRenewDialog] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReturn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = await returnBook(returnDialog.id, fd.get("notes") as string || undefined);
    if (result?.error) toast.error(result.error);
    else {
      if (result.fineAmount && result.fineAmount > 0) {
        toast.warning(`Book returned. Fine of ₹${result.fineAmount} applied for late return.`);
      } else {
        toast.success("Book returned successfully.");
      }
      setReturnDialog(null);
    }
    setIsSubmitting(false);
  };

  const handleRenew = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = await renewBook(renewDialog.id, fd.get("new_due_date") as string);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Book renewal successful.");
      setRenewDialog(null);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Books", value: stats.totalBooks, icon: <BookOpen className="w-4 h-4" />, color: "text-primary" },
          { label: "Total Copies", value: stats.totalCopies, icon: <BookOpen className="w-4 h-4" />, color: "text-muted-foreground" },
          { label: "Available", value: stats.availableCopies, icon: <BookOpen className="w-4 h-4" />, color: "text-green-600" },
          { label: "Issued", value: stats.issuedCopies, icon: <RefreshCcw className="w-4 h-4" />, color: "text-blue-600" },
          { label: "Overdue", value: stats.overdueCount, icon: <AlertCircle className="w-4 h-4" />, color: "text-red-600" },
          { label: "Members", value: stats.activeMembers, icon: <Users className="w-4 h-4" />, color: "text-purple-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                <span className={s.color}>{s.icon}</span>
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: "/library/books", label: "Book Catalog", desc: "Add, edit, and search books", icon: <BookOpen className="w-5 h-5" /> },
          { href: "/library/transactions", label: "Issue / Return", desc: "Manage book circulation", icon: <RefreshCcw className="w-5 h-5" /> },
          { href: "/library/members", label: "Members", desc: "Register and manage library members", icon: <Users className="w-5 h-5" /> },
        ].map(n => (
          <Card key={n.href} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-md bg-primary/10 text-primary">{n.icon}</div>
                <h3 className="font-semibold">{n.label}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{n.desc}</p>
              <Link href={n.href} className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                Open <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fine Rules (Librarian only) */}
      {isLibrarian && (
        <FineRulesCard fineRule={fineRule} />
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Recent Circulation</CardTitle>
          <Link href="/library/transactions" className="text-sm text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Book</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                {isLibrarian && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="font-medium">{tx.library_members?.profiles?.first_name} {tx.library_members?.profiles?.last_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{tx.book_copies?.books?.title}</div>
                    <div className="text-xs text-muted-foreground">{tx.book_copies?.accession_number}</div>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(tx.issue_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">
                    <span className={new Date(tx.due_date) < new Date() && tx.status === "ISSUED" ? "text-red-600 font-semibold" : ""}>
                      {new Date(tx.due_date).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[tx.status] || "outline"}>{tx.status}</Badge>
                    {tx.renewal_count > 0 && <span className="text-xs text-muted-foreground ml-1">({tx.renewal_count} renewed)</span>}
                  </TableCell>
                  {isLibrarian && (
                    <TableCell className="text-right">
                      {tx.status === "ISSUED" || tx.status === "OVERDUE" ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setReturnDialog(tx)}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Return
                          </Button>
                          {(tx.renewal_count || 0) < 2 && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setRenewDialog(tx)}>
                              <RefreshCcw className="w-3 h-3 mr-1" /> Renew
                            </Button>
                          )}
                        </div>
                      ) : "—"}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {recentTransactions.length === 0 && (
                <TableRow><TableCell colSpan={isLibrarian ? 6 : 5} className="text-center py-8 text-muted-foreground">No transactions yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Return Dialog */}
      <Dialog open={!!returnDialog} onOpenChange={open => !open && setReturnDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Return Book — {returnDialog?.book_copies?.books?.title}</DialogTitle></DialogHeader>
          <form onSubmit={handleReturn}>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/30 rounded-md text-sm">
                <div className="flex justify-between"><span>Due Date:</span><span className="font-semibold">{returnDialog ? new Date(returnDialog.due_date).toLocaleDateString() : ""}</span></div>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input name="notes" placeholder="e.g. Slight damage on cover..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReturnDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Confirm Return</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Renew Dialog */}
      <Dialog open={!!renewDialog} onOpenChange={open => !open && setRenewDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renew Book — {renewDialog?.book_copies?.books?.title}</DialogTitle></DialogHeader>
          <form onSubmit={handleRenew}>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/30 rounded-md text-sm">
                <div className="flex justify-between"><span>Current Due:</span><span className="font-semibold">{renewDialog ? new Date(renewDialog.due_date).toLocaleDateString() : ""}</span></div>
                <div className="flex justify-between mt-1"><span>Renewals Used:</span><span>{renewDialog?.renewal_count || 0} / 2</span></div>
              </div>
              <div className="space-y-2">
                <Label>New Due Date</Label>
                <Input name="new_due_date" type="date" required min={new Date().toISOString().split("T")[0]} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenewDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Confirm Renewal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────
function FineRulesCard({ fineRule }: { fineRule: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = await saveFineRule(fd);
    if (result?.error) toast.error(result.error);
    else toast.success("Fine rules saved.");
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Fine Configuration</CardTitle></CardHeader>
      <form onSubmit={handleSave}>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fine per Day (₹)</Label>
              <Input name="fine_per_day" type="number" step="0.50" defaultValue={fineRule?.fine_per_day ?? 2} required />
            </div>
            <div className="space-y-2">
              <Label>Max Fine Cap (₹, optional)</Label>
              <Input name="max_fine" type="number" step="1" defaultValue={fineRule?.max_fine ?? ""} placeholder="No cap" />
            </div>
            <div className="space-y-2">
              <Label>Grace Period (days)</Label>
              <Input name="grace_days" type="number" min="0" defaultValue={fineRule?.grace_days ?? 0} required />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="sm" disabled={isSubmitting}>Save Fine Rules</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
