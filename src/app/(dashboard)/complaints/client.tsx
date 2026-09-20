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
import { createComplaint, updateComplaintStatus } from "../complaints/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";

const CATEGORIES = ["ACADEMIC", "HOSTEL", "TRANSPORT", "OTHER"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const categoryColors: Record<string, string> = {
  ACADEMIC: "bg-blue-100 text-blue-800 border-blue-200",
  HOSTEL: "bg-orange-100 text-orange-800 border-orange-200",
  TRANSPORT: "bg-gray-100 text-gray-600 border-gray-200",
  OTHER: "bg-slate-100 text-slate-800 border-slate-200",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600 border-gray-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  URGENT: "bg-red-100 text-red-800 border-red-200",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 border-blue-200",
  ASSIGNED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_PROGRESS: "bg-orange-100 text-orange-800 border-orange-200",
  RESOLVED: "bg-green-100 text-green-800 border-green-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};

export function ComplaintsClient({
  complaints,
  staffList,
}: {
  complaints: any[];
  staffList: any[];
}) {
  const [createDialog, setCreateDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState<any>(null);
  const [assignStatus, setAssignStatus] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCount = complaints.filter((c) => c.status === "OPEN").length;
  const inProgressCount = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED").length;
  const closedCount = complaints.filter((c) => c.status === "CLOSED").length;

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createComplaint(new FormData(e.currentTarget));
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Complaint submitted successfully");
      setCreateDialog(false);
    }
    setIsSubmitting(false);
  };

  const handleAssign = async () => {
    if (!assignDialog) return;
    setIsSubmitting(true);
    const result = await updateComplaintStatus(
      assignDialog.id,
      assignStatus || assignDialog.status,
      assignTo || undefined,
      resolutionNote || undefined
    );
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Complaint updated successfully");
      setAssignDialog(null);
      setAssignStatus("");
      setAssignTo("");
      setResolutionNote("");
    }
    setIsSubmitting(false);
  };

  const openAssignDialog = (complaint: any) => {
    setAssignDialog(complaint);
    setAssignStatus(complaint.status);
    setAssignTo(complaint.assigned_to || "");
    setResolutionNote(complaint.resolution_note || "");
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Open</span>
              <AlertCircle className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{openCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">In Progress</span>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resolved</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Closed</span>
              <XCircle className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold">{closedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Button */}
      <div className="flex justify-end">
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Complaint
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{c.title}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${categoryColors[c.category] || categoryColors.OTHER}`}>
                      {c.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${priorityColors[c.priority] || priorityColors.MEDIUM}`}>
                      {c.priority}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.profiles?.first_name} {c.profiles?.last_name}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColors[c.status] || statusColors.OPEN}`}>
                      {c.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.assigned_to
                      ? staffList.find((s) => s.id === c.assigned_to)
                        ? `${staffList.find((s) => s.id === c.assigned_to)?.first_name} ${staffList.find((s) => s.id === c.assigned_to)?.last_name}`
                        : "—"
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openAssignDialog(c)}>
                      Assign/Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {complaints.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No complaints found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Complaint</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select name="category" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input name="title" required placeholder="Brief description of the issue" />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea name="description" required placeholder="Describe the issue in detail..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue="MEDIUM">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Attachment URL</Label>
                  <Input name="attachment_url" placeholder="Optional attachment link" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign/Update Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={(open) => !open && setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {assignDialog && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">{assignDialog.title}</p>
                <p className="text-sm text-muted-foreground">{assignDialog.category} • {assignDialog.priority}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select value={assignTo} onValueChange={(val: string | null) => setAssignTo(val || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select staff..." />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={assignStatus} onValueChange={(val: string | null) => setAssignStatus(val || "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resolution Note</Label>
              <Textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Optional resolution note..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
