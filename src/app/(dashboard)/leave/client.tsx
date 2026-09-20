/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitLeaveRequest, cancelLeaveRequest, approveLeaveRequest, rejectLeaveRequest } from "../leave/actions";
import { Clock, CheckCircle, XCircle, Ban, Plus, Calendar } from "lucide-react";

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-800 border-green-200" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

export function LeaveClient({
  leaveRequests,
  isApprover,
  studentId,
}: {
  leaveRequests: any[];
  isApprover?: boolean;
  studentId?: string;
}) {
  const [submitDialog, setSubmitDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingCount = leaveRequests.filter((r) => r.status === "PENDING").length;
  const approvedCount = leaveRequests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = leaveRequests.filter((r) => r.status === "REJECTED").length;
  const cancelledCount = leaveRequests.filter((r) => r.status === "CANCELLED").length;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await submitLeaveRequest(new FormData(e.currentTarget));
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Leave request submitted successfully");
      setSubmitDialog(false);
    }
    setIsSubmitting(false);
  };

  const handleCancel = async (id: string) => {
    const result = await cancelLeaveRequest(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Leave request cancelled");
    }
  };

  const handleApprove = async (id: string) => {
    const result = await approveLeaveRequest(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Leave request approved");
    }
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    const result = await rejectLeaveRequest(rejectDialog.id, rejectReason);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Leave request rejected");
      setRejectDialog(null);
      setRejectReason("");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending</span>
              <Clock className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Approved</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rejected</span>
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cancelled</span>
              <Ban className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold">{cancelledCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {!isApprover && (
        <div className="flex justify-end">
          <Button onClick={() => setSubmitDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Submit Leave
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((lr) => {
                const info = statusConfig[lr.status] || statusConfig.PENDING;
                const isOwned = lr.requester_id === studentId || !studentId;
                return (
                  <TableRow key={lr.id}>
                    <TableCell className="font-medium">
                      {lr.profiles?.first_name} {lr.profiles?.last_name}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {formatDate(lr.start_date)} — {formatDate(lr.end_date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{lr.reason || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${info.className}`}>
                        {info.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {isApprover && lr.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="default" onClick={() => handleApprove(lr.id)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setRejectDialog(lr)}>
                            Reject
                          </Button>
                        </div>
                      )}
                      {!isApprover && isOwned && lr.status === "PENDING" && (
                        <Button size="sm" variant="outline" onClick={() => handleCancel(lr.id)}>
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {leaveRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No leave requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Submit Dialog */}
      <Dialog open={submitDialog} onOpenChange={setSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Leave Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input type="date" name="start_date" required />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input type="date" name="end_date" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Textarea name="reason" required placeholder="Reason for leave..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubmitDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Rejection</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Optional rejection reason..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
