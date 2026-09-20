/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { issueBook, returnBook, renewBook, payFine, waiveFine } from "../actions";
import { BookOpen, RotateCcw, RefreshCcw, IndianRupee } from "lucide-react";

export function TransactionsClient({ transactions, members, availableCopies, fines, collegeId }: {
  transactions: any[];
  members: any[];
  availableCopies: any[];
  fines: any[];
  collegeId: string;
}) {
  const [tab, setTab] = useState<"active" | "all" | "fines">("active");
  const [issueDialog, setIssueDialog] = useState(false);
  const [returnDialog, setReturnDialog] = useState<any>(null);
  const [renewDialog, setRenewDialog] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeTransactions = transactions.filter(tx => tx.status === "ISSUED" || tx.status === "OVERDUE");
  const displayTx = tab === "active" ? activeTransactions : transactions;

  const handleIssue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = await issueBook({
      member_id: fd.get("member_id") as string,
      copy_id: fd.get("copy_id") as string,
      due_date: fd.get("due_date") as string,
    });
    if (result?.error) toast.error(result.error);
    else { toast.success("Book issued successfully!"); setIssueDialog(false); }
    setIsSubmitting(false);
  };

  const handleReturn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = await returnBook(returnDialog.id, fd.get("notes") as string || undefined);
    if (result?.error) toast.error(result.error);
    else {
      if ((result.fineAmount || 0) > 0) toast.warning(`Book returned. Fine of ₹${result.fineAmount} applied.`);
      else toast.success("Book returned successfully.");
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
    else { toast.success("Renewed!"); setRenewDialog(null); }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["active", "all", "fines"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              {t === "active" ? `Active (${activeTransactions.length})` : t === "all" ? "All Transactions" : `Fines (${fines.length})`}
            </button>
          ))}
        </div>
        <Button onClick={() => setIssueDialog(true)}>
          <BookOpen className="w-4 h-4 mr-2" /> Issue Book
        </Button>
      </div>

      {/* Transactions Table */}
      {tab !== "fines" && (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Copy #</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTx.map(tx => {
                  const isOverdue = new Date(tx.due_date) < new Date() && tx.status === "ISSUED";
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.library_members?.profiles?.first_name} {tx.library_members?.profiles?.last_name}</TableCell>
                      <TableCell>
                        <div>{tx.book_copies?.books?.title}</div>
                        <div className="text-xs text-muted-foreground">{tx.book_copies?.books?.author}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{tx.book_copies?.accession_number}</TableCell>
                      <TableCell className="text-sm">{new Date(tx.issue_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={isOverdue ? "text-red-600 font-bold" : ""}>
                          {new Date(tx.due_date).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.status === "RETURNED" ? "default" : isOverdue ? "destructive" : "secondary"}>
                          {isOverdue ? "OVERDUE" : tx.status}
                        </Badge>
                        {tx.renewal_count > 0 && <span className="text-xs text-muted-foreground ml-1">(R:{tx.renewal_count})</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {(tx.status === "ISSUED" || isOverdue) ? (
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
                    </TableRow>
                  );
                })}
                {displayTx.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No transactions found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Fines */}
      {tab === "fines" && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><IndianRupee className="w-4 h-4" /> Library Fines</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fines.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.library_transactions?.library_members?.profiles?.first_name} {f.library_transactions?.library_members?.profiles?.last_name}</TableCell>
                    <TableCell>{f.library_transactions?.book_copies?.books?.title}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-red-600">₹{f.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={f.status === "PAID" ? "default" : f.status === "WAIVED" ? "secondary" : "destructive"} className={f.status === "PAID" ? "bg-green-500" : ""}>{f.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {f.status === "UNPAID" && (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => payFine(f.id).then(r => r?.error ? toast.error(r.error) : toast.success("Paid!"))}>Paid</Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => waiveFine(f.id).then(r => r?.error ? toast.error(r.error) : toast.success("Waived!"))}>Waive</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {fines.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No fines recorded.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Issue Dialog */}
      <Dialog open={issueDialog} onOpenChange={setIssueDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue a Book</DialogTitle></DialogHeader>
          <form onSubmit={handleIssue}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Member</Label>
                <Select name="member_id" required>
                  <SelectTrigger><SelectValue placeholder="Select member..." /></SelectTrigger>
                  <SelectContent>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.profiles?.first_name} {m.profiles?.last_name} ({m.member_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Book Copy</Label>
                <Select name="copy_id" required>
                  <SelectTrigger><SelectValue placeholder="Select available copy..." /></SelectTrigger>
                  <SelectContent>
                    {availableCopies.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.books?.title} — {c.accession_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input name="due_date" type="date" required min={new Date().toISOString().split("T")[0]} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIssueDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Issue Book</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={!!returnDialog} onOpenChange={open => !open && setReturnDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Return — {returnDialog?.book_copies?.books?.title}</DialogTitle></DialogHeader>
          <form onSubmit={handleReturn}>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/30 rounded-md text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Member:</span><span>{returnDialog?.library_members?.profiles?.first_name} {returnDialog?.library_members?.profiles?.last_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Due Date:</span>
                  <span className={new Date(returnDialog?.due_date) < new Date() ? "text-red-600 font-bold" : ""}>{returnDialog ? new Date(returnDialog.due_date).toLocaleDateString() : ""}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Condition Notes (optional)</Label>
                <Input name="notes" placeholder="e.g. Minor water damage on page 12..." />
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
          <DialogHeader><DialogTitle>Renew — {renewDialog?.book_copies?.books?.title}</DialogTitle></DialogHeader>
          <form onSubmit={handleRenew}>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/30 rounded-md text-sm space-y-1">
                <div className="flex justify-between"><span>Current Due:</span><span className="font-semibold">{renewDialog ? new Date(renewDialog.due_date).toLocaleDateString() : ""}</span></div>
                <div className="flex justify-between"><span>Renewals Used:</span><span>{renewDialog?.renewal_count || 0} / 2</span></div>
              </div>
              <div className="space-y-2">
                <Label>New Due Date</Label>
                <Input name="new_due_date" type="date" required min={new Date().toISOString().split("T")[0]} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenewDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Renew</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
