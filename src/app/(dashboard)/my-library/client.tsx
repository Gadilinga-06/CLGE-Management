/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cancelReservation } from "../library/actions";
import { BookOpen, IndianRupee, AlertCircle, Clock } from "lucide-react";

export function MyLibraryClient({ member, transactions, fines, reservations }: {
  member: any;
  transactions: any[];
  fines: any[];
  reservations: any[];
}) {
  const active = transactions.filter(tx => tx.status === "ISSUED");
  const overdue = transactions.filter(tx => new Date(tx.due_date) < new Date() && tx.status === "ISSUED");
  const unpaidFines = fines.filter(f => f.status === "UNPAID").reduce((s: number, f: any) => s + f.amount, 0);

  if (!member) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">You are not registered as a library member yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Contact the librarian to get registered.</p>
        </CardContent>
      </Card>
    );
  }

  const handleCancel = async (id: string) => {
    const result = await cancelReservation(id);
    if (result?.error) toast.error(result.error);
    else toast.success("Reservation cancelled.");
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground"><BookOpen className="w-4 h-4" /><span className="text-xs font-medium uppercase">Borrowed</span></div>
            <div className="text-2xl font-bold">{active.length} / {member.max_books}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground"><AlertCircle className="w-4 h-4" /><span className="text-xs font-medium uppercase">Overdue</span></div>
            <div className={`text-2xl font-bold ${overdue.length > 0 ? "text-red-600" : "text-green-600"}`}>{overdue.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground"><Clock className="w-4 h-4" /><span className="text-xs font-medium uppercase">Reservations</span></div>
            <div className="text-2xl font-bold">{reservations.filter(r => r.status === "ACTIVE").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground"><IndianRupee className="w-4 h-4" /><span className="text-xs font-medium uppercase">Fines Due</span></div>
            <div className={`text-2xl font-bold ${unpaidFines > 0 ? "text-red-600" : "text-green-600"}`}>₹{unpaidFines.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Currently Borrowed */}
      <Card>
        <CardHeader><CardTitle>Currently Borrowed</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Renewals</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {active.map(tx => {
                const isOverdue = new Date(tx.due_date) < new Date();
                return (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="font-medium">{tx.book_copies?.books?.title}</div>
                      <div className="text-xs text-muted-foreground">{tx.book_copies?.books?.author}</div>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(tx.issue_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={isOverdue ? "text-red-600 font-bold" : ""}>{new Date(tx.due_date).toLocaleDateString()}</span>
                    </TableCell>
                    <TableCell className="text-center">{tx.renewal_count || 0} / 2</TableCell>
                    <TableCell>
                      <Badge variant={isOverdue ? "destructive" : "secondary"}>{isOverdue ? "OVERDUE" : "ISSUED"}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {active.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No books currently borrowed.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reservations */}
      {reservations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>My Reservations</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Reserved On</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.books?.title}</div>
                      <div className="text-xs text-muted-foreground">{r.books?.author}</div>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(r.reserved_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{new Date(r.expires_at).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant={r.status === "ACTIVE" ? "secondary" : "outline"}>{r.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {r.status === "ACTIVE" && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-500" onClick={() => handleCancel(r.id)}>Cancel</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Fines */}
      {fines.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Library Fines</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fines.map(f => (
                  <TableRow key={f.id}>
                    <TableCell>{f.library_transactions?.book_copies?.books?.title}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-red-600">₹{f.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={f.status === "PAID" ? "default" : f.status === "WAIVED" ? "secondary" : "destructive"} className={f.status === "PAID" ? "bg-green-500" : ""}>{f.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader><CardTitle>Borrowing History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Returned</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.filter(tx => tx.status === "RETURNED").map(tx => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="font-medium">{tx.book_copies?.books?.title}</div>
                    <div className="text-xs text-muted-foreground">{tx.book_copies?.books?.author}</div>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(tx.issue_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{tx.return_date ? new Date(tx.return_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell><Badge variant="default" className="bg-green-500">RETURNED</Badge></TableCell>
                </TableRow>
              ))}
              {transactions.filter(tx => tx.status === "RETURNED").length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No history yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
