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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { recordPayment, applyAdjustment, processRefund, calculateLateFees } from "../actions";
import { Search, Receipt, IndianRupee, Printer, RotateCcw, RefreshCw } from "lucide-react";

const PAYMENT_METHODS = ["CASH", "CARD", "BANK_TRANSFER", "ONLINE", "DD", "CHEQUE"];
const REFUND_METHODS = ["ORIGINAL", "BANK_TRANSFER", "CHEQUE", "CASH"];

const statusColors: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  PENDING: "bg-red-100 text-red-800",
};

export function PaymentsClient({ recentPayments, collegeId }: { recentPayments: any[]; collegeId: string }) {
  const [admissionNo, setAdmissionNo] = useState("");
  const [studentData, setStudentData] = useState<any>(null);
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [payDialog, setPayDialog] = useState<any>(null);
  const [adjustDialog, setAdjustDialog] = useState<any>(null);
  const [receiptDialog, setReceiptDialog] = useState<any>(null);
  const [refundDialog, setRefundDialog] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingLate, setIsCalculatingLate] = useState(false);
  const supabase = createClient();

  const searchStudent = async () => {
    if (!admissionNo.trim()) return;
    setIsSearching(true);
    setStudentData(null);
    setStudentFees([]);

    const { data: student } = await supabase
      .from("students")
      .select("id, admission_number, profiles(first_name, last_name, email, avatar_url)")
      .eq("admission_number", admissionNo.trim())
      .single();

    if (!student) {
      toast.error("Student not found.");
      setIsSearching(false);
      return;
    }

    setStudentData(student);

    const { data: fees } = await supabase
      .from("student_fees")
      .select(`
        id, amount_due, paid_amount, scholarship_amount, discount_amount, late_fee_amount, status, remarks, due_date,
        fee_structures (category, amount, due_date, academic_years(name), late_fee_per_day, late_fee_max, grace_days)
      `)
      .eq("student_id", student.id)
      .eq("college_id", collegeId)
      .order("created_at", { ascending: false });

    setStudentFees(fees || []);
    setIsSearching(false);
  };

  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = await recordPayment({
      student_fee_id: payDialog.id,
      student_id: studentData.id,
      amount: parseFloat(fd.get("amount") as string),
      payment_method: fd.get("payment_method") as string,
      reference_number: fd.get("reference_number") as string || undefined,
    });
    if (result?.error) toast.error(result.error);
    else {
      toast.success(`Payment recorded! Receipt: ${result.receiptNumber}`);
      setPayDialog(null);
      searchStudent();
    }
    setIsSubmitting(false);
  };

  const handleAdjustment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = await applyAdjustment({
      student_fee_id: adjustDialog.id,
      type: fd.get("type") as "scholarship" | "discount",
      amount: parseFloat(fd.get("amount") as string),
      reason: fd.get("reason") as string || undefined,
    });
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Adjustment applied.");
      setAdjustDialog(null);
      searchStudent();
    }
    setIsSubmitting(false);
  };

  const handleRefund = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = await processRefund({
      payment_id: refundDialog.payment_id,
      amount: parseFloat(fd.get("amount") as string),
      reason: fd.get("reason") as string,
      refund_method: fd.get("refund_method") as string || "ORIGINAL",
      reference_number: fd.get("reference_number") as string || undefined,
    });
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Refund processed successfully.");
      setRefundDialog(null);
      searchStudent();
    }
    setIsSubmitting(false);
  };

  const handleCalculateLateFees = async () => {
    setIsCalculatingLate(true);
    const result = await calculateLateFees();
    if (result?.error) toast.error(result.error);
    else toast.success(`Late fees updated for ${result.updated} record(s).`);
    setIsCalculatingLate(false);
    if (studentData) searchStudent();
  };

  const getOutstanding = (sf: any) => {
    const effective = (sf.amount_due || 0) + (sf.late_fee_amount || 0) - (sf.scholarship_amount || 0) - (sf.discount_amount || 0);
    return Math.max(0, effective - (sf.paid_amount || 0));
  };

  const totalDue = studentFees.reduce((sum, sf) => sum + (sf.amount_due || 0), 0);
  const totalPaid = studentFees.reduce((sum, sf) => sum + (sf.paid_amount || 0), 0);
  const totalOutstanding = studentFees.reduce((sum, sf) => sum + getOutstanding(sf), 0);
  const totalLateFees = studentFees.reduce((sum, sf) => sum + (sf.late_fee_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <span className="flex items-center gap-2"><Search className="w-4 h-4" /> Find Student</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCalculateLateFees}
              disabled={isCalculatingLate}
              className="h-8"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isCalculatingLate ? "animate-spin" : ""}`} />
              {isCalculatingLate ? "Calculating..." : "Calculate Late Fees"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 max-w-md">
            <Input
              placeholder="Enter Admission Number..."
              value={admissionNo}
              onChange={e => setAdmissionNo(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchStudent()}
            />
            <Button onClick={searchStudent} disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student fee summary */}
      {studentData && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={studentData.profiles?.avatar_url} />
                  <AvatarFallback>{studentData.profiles?.first_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{studentData.profiles?.first_name} {studentData.profiles?.last_name}</h3>
                  <p className="text-sm text-muted-foreground">{studentData.admission_number} • {studentData.profiles?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">₹{totalDue.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total Fees</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">₹{totalPaid.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">Amount Paid</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">₹{totalOutstanding.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">Outstanding</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">₹{totalLateFees.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">Late Fees</div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead className="text-right">Late Fee</TableHead>
                    <TableHead className="text-right">Scholarship</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentFees.map(sf => (
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
                      <TableCell className="text-right font-mono text-green-700">₹{(sf.paid_amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-red-700">₹{getOutstanding(sf).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">
                        {sf.fee_structures?.due_date ? new Date(sf.fee_structures.due_date).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[sf.status] || statusColors.PENDING}`}>
                          {sf.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {sf.status !== "PAID" && (
                            <>
                              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPayDialog(sf)}>
                                <IndianRupee className="w-3 h-3 mr-1" /> Collect
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setAdjustDialog(sf)}>
                                Adjust
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {studentFees.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No fees assigned to this student.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Recent Payments Table */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="w-4 h-4" /> Recent Collections</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.receipts?.[0]?.receipt_number || "—"}</TableCell>
                  <TableCell>
                    <div className="font-medium">{p.students?.profiles?.first_name} {p.students?.profiles?.last_name}</div>
                    <div className="text-xs text-muted-foreground">{p.students?.admission_number}</div>
                  </TableCell>
                  <TableCell>{p.student_fees?.fee_structures?.category || "—"}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">₹{p.amount.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{p.payment_method}</Badge></TableCell>
                  <TableCell className="text-sm">{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "REFUNDED" ? "destructive" : "outline"} className="text-xs">
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setReceiptDialog(p)}>
                        <Printer className="w-3 h-3 mr-1" /> Receipt
                      </Button>
                      {p.status === "COMPLETED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-orange-600 hover:text-orange-700"
                          onClick={() => setRefundDialog({ payment_id: p.id, max_amount: p.amount, payment: p })}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Refund
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {recentPayments.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No payments recorded yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Collection Modal */}
      <Dialog open={!!payDialog} onOpenChange={open => !open && setPayDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect Payment — {payDialog?.fee_structures?.category}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordPayment}>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/30 rounded-md text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Fee Amount:</span> <span>₹{(payDialog?.amount_due || 0).toLocaleString()}</span></div>
                {(payDialog?.late_fee_amount || 0) > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Late Fee:</span> <span className="text-orange-600">₹{payDialog?.late_fee_amount.toLocaleString()}</span></div>
                )}
                {(payDialog?.scholarship_amount || 0) > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Scholarship:</span> <span className="text-blue-600">-₹{payDialog?.scholarship_amount.toLocaleString()}</span></div>
                )}
                {(payDialog?.discount_amount || 0) > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Discount:</span> <span className="text-blue-600">-₹{payDialog?.discount_amount.toLocaleString()}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Already Paid:</span> <span className="text-green-600">₹{(payDialog?.paid_amount || 0).toLocaleString()}</span></div>
                <div className="flex justify-between border-t pt-1"><span className="font-medium">Outstanding:</span> <span className="font-bold text-red-600">₹{payDialog ? getOutstanding(payDialog).toLocaleString() : 0}</span></div>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input name="amount" type="number" step="0.01" max={payDialog ? getOutstanding(payDialog) : 0} min="0.01" required placeholder="Enter amount" />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select name="payment_method" required>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference / Transaction Number (optional)</Label>
                <Input name="reference_number" placeholder="UTR / Cheque No. / DD No." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Collect & Issue Receipt</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjustment Modal */}
      <Dialog open={!!adjustDialog} onOpenChange={open => !open && setAdjustDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Adjustment — {adjustDialog?.fee_structures?.category}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjustment}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <Select name="type" required>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scholarship">Scholarship</SelectItem>
                    <SelectItem value="discount">Discount / Waiver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input name="amount" type="number" step="0.01" min="0" required />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input name="reason" placeholder="e.g. Merit scholarship, Sibling discount..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Apply</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={!!refundDialog} onOpenChange={open => !open && setRefundDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRefund}>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-orange-50 rounded-md text-sm">
                <p className="text-muted-foreground">Original payment: <span className="font-semibold">₹{refundDialog?.max_amount?.toLocaleString()}</span></p>
                <p className="text-xs text-muted-foreground mt-1">Refund will be processed and the student&apos;s fee balance will be adjusted.</p>
              </div>
              <div className="space-y-2">
                <Label>Refund Amount (₹)</Label>
                <Input name="amount" type="number" step="0.01" min="0.01" max={refundDialog?.max_amount} required placeholder="Enter refund amount" />
              </div>
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Input name="reason" required placeholder="e.g. Fee overpayment, course withdrawal..." />
              </div>
              <div className="space-y-2">
                <Label>Refund Method</Label>
                <Select name="refund_method" defaultValue="ORIGINAL">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REFUND_METHODS.map(m => <SelectItem key={m} value={m}>{m.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference Number (optional)</Label>
                <Input name="reference_number" placeholder="Transaction / Cheque No." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRefundDialog(null)}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>Process Refund</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt Print Modal */}
      <Dialog open={!!receiptDialog} onOpenChange={open => !open && setReceiptDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Official Receipt</DialogTitle>
          </DialogHeader>
          {receiptDialog && (
            <div id="receipt-content" className="space-y-4 py-2">
              <div className="text-center border-b pb-4">
                <h3 className="font-bold text-lg uppercase tracking-wider">Fee Receipt</h3>
                <p className="text-xs text-muted-foreground mt-1">Receipt No: {receiptDialog.receipts?.[0]?.receipt_number}</p>
                <p className="text-xs text-muted-foreground">Date: {new Date(receiptDialog.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Student:</span><span className="font-medium">{receiptDialog.students?.profiles?.first_name} {receiptDialog.students?.profiles?.last_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Admission No:</span><span>{receiptDialog.students?.admission_number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fee Type:</span><span>{receiptDialog.student_fees?.fee_structures?.category}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Method:</span><span>{receiptDialog.payment_method}</span></div>
                {receiptDialog.reference_number && <div className="flex justify-between"><span className="text-muted-foreground">Reference:</span><span className="font-mono text-xs">{receiptDialog.reference_number}</span></div>}
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-bold text-lg">Amount Paid</span>
                <span className="font-bold text-2xl text-primary">₹{receiptDialog.amount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">This is a computer-generated receipt. No signature required.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialog(null)}>Close</Button>
            <Button onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
