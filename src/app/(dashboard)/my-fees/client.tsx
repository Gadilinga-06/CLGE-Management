/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Printer, Receipt, IndianRupee, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PAID: "default",
  PARTIAL: "secondary",
  PENDING: "destructive",
};

export function MyFeesClient({ fees, payments, refunds, student }: { fees: any[]; payments: any[]; refunds: any[]; student: any }) {
  const [receiptDialog, setReceiptDialog] = useState<any>(null);
  const [tab, setTab] = useState<"fees" | "history" | "refunds">("fees");

  const getOutstanding = (sf: any) => {
    const effective = (sf.amount_due || 0) + (sf.late_fee_amount || 0) - (sf.scholarship_amount || 0) - (sf.discount_amount || 0);
    return Math.max(0, effective - (sf.paid_amount || 0));
  };

  const totalDue = fees.reduce((s, sf) => s + (sf.amount_due || 0), 0);
  const totalPaid = fees.reduce((s, sf) => s + (sf.paid_amount || 0), 0);
  const totalOutstanding = fees.reduce((s, sf) => s + getOutstanding(sf), 0);
  const totalLateFees = fees.reduce((s, sf) => s + (sf.late_fee_amount || 0), 0);
  const totalRefunded = refunds.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Fees</span>
              <IndianRupee className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">₹{totalDue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount Paid</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding</span>
              <Clock className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">₹{totalOutstanding.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Late Fees</span>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-600">₹{totalLateFees.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        {(["fees", "history", "refunds"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            {t === "fees" ? "Fee Summary" : t === "history" ? "Payment History" : `Refunds${refunds.length > 0 ? ` (${refunds.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* Fee Summary */}
      {tab === "fees" && (
        <Card>
          <CardHeader><CardTitle>My Fee Ledger</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Late Fee</TableHead>
                  <TableHead className="text-right">Scholarship</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map(sf => (
                  <TableRow key={sf.id}>
                    <TableCell className="font-medium">{sf.fee_structures?.category}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sf.fee_structures?.academic_years?.name}</TableCell>
                    <TableCell className="text-right font-mono">₹{(sf.amount_due || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-orange-600">
                      {(sf.late_fee_amount || 0) > 0 ? `₹${(sf.late_fee_amount || 0).toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-blue-600">
                      {(sf.scholarship_amount || 0) > 0 ? `₹${(sf.scholarship_amount || 0).toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-blue-600">
                      {(sf.discount_amount || 0) > 0 ? `₹${(sf.discount_amount || 0).toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">₹{(sf.paid_amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-red-600">₹{getOutstanding(sf).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">
                      {sf.fee_structures?.due_date ? new Date(sf.fee_structures.due_date).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[sf.status] || "outline"}>{sf.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {fees.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No fees have been assigned yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {tab === "history" && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="w-4 h-4" /> Payment History</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.receipts?.[0]?.receipt_number || "—"}</TableCell>
                    <TableCell>{p.student_fees?.fee_structures?.category || "—"}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-green-700">₹{p.amount.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{p.payment_method}</Badge></TableCell>
                    <TableCell className="text-sm">{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "REFUNDED" ? "destructive" : "outline"} className="text-xs">{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status === "COMPLETED" && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setReceiptDialog({ ...p, studentName: `${student.profiles?.first_name} ${student.profiles?.last_name}`, admissionNo: student.admission_number })}>
                          <Printer className="w-3 h-3 mr-1" /> Receipt
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments recorded yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Refunds Tab */}
      {tab === "refunds" && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><IndianRupee className="w-4 h-4" /> Refund History</CardTitle></CardHeader>
          <CardContent>
            {totalRefunded > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg mb-4 text-sm">
                <span className="text-muted-foreground">Total Refunded: </span>
                <span className="font-bold text-orange-700">₹{totalRefunded.toLocaleString()}</span>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{r.reason || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{r.refund_method?.replace("_", " ")}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{r.reference_number || "—"}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-red-700">₹{r.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {refunds.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No refunds processed.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Receipt Dialog */}
      <Dialog open={!!receiptDialog} onOpenChange={open => !open && setReceiptDialog(null)}>
        <DialogContent className="max-w-md print:shadow-none">
          <DialogHeader>
            <DialogTitle className="text-center">Official Fee Receipt</DialogTitle>
          </DialogHeader>
          {receiptDialog && (
            <div className="space-y-4 py-2 print:py-0">
              <div className="text-center border-b pb-4">
                <p className="font-mono text-sm text-muted-foreground">Receipt No: {receiptDialog.receipts?.[0]?.receipt_number}</p>
                <p className="text-xs text-muted-foreground mt-1">Date: {receiptDialog.receipts?.[0]?.issued_at ? new Date(receiptDialog.receipts[0].issued_at).toLocaleString() : new Date(receiptDialog.payment_date).toLocaleDateString()}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Student:</span><span className="font-medium">{receiptDialog.studentName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Admission No:</span><span>{receiptDialog.admissionNo}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fee Type:</span><span>{receiptDialog.student_fees?.fee_structures?.category}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Method:</span><span>{receiptDialog.payment_method}</span></div>
                {receiptDialog.reference_number && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Reference:</span><span className="font-mono text-xs">{receiptDialog.reference_number}</span></div>
                )}
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-bold">Amount Paid</span>
                <span className="font-bold text-2xl text-green-700">₹{receiptDialog.amount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">This is a computer-generated receipt. No signature required.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialog(null)}>Close</Button>
            <Button onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Print Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
