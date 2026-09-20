/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateSupportTicket, addTicketActivity } from "../help-desk/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

const STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 border-blue-200",
  ASSIGNED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_PROGRESS: "bg-orange-100 text-orange-800 border-orange-200",
  RESOLVED: "bg-green-100 text-green-800 border-green-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600 border-gray-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  URGENT: "bg-red-100 text-red-800 border-red-200",
};

export function HelpDeskClient({
  tickets,
  staffList,
  activities,
}: {
  tickets: any[];
  staffList: any[];
  activities?: any[];
}) {
  const [updateDialog, setUpdateDialog] = useState<any>(null);
  const [activityDialog, setActivityDialog] = useState<any>(null);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [activityAction, setActivityAction] = useState("");
  const [activityMessage, setActivityMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;
  const closedCount = tickets.filter((t) => t.status === "CLOSED").length;

  const handleUpdate = async () => {
    if (!updateDialog) return;
    setIsSubmitting(true);
    const result = await updateSupportTicket(
      updateDialog.id,
      updateStatus || updateDialog.status,
      assignedTo || undefined,
      resolutionNote || undefined
    );
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Ticket updated successfully");
      setUpdateDialog(null);
      setUpdateStatus("");
      setAssignedTo("");
      setResolutionNote("");
    }
    setIsSubmitting(false);
  };

  const handleAddActivity = async () => {
    if (!activityDialog) return;
    if (!activityMessage.trim()) {
      toast.error("Please enter an activity message");
      return;
    }
    setIsSubmitting(true);
    const result = await addTicketActivity(
      activityDialog.id,
      activityAction || "COMMENT",
      activityMessage
    );
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Activity added");
      setActivityDialog(null);
      setActivityAction("");
      setActivityMessage("");
    }
    setIsSubmitting(false);
  };

  const openUpdateDialog = (ticket: any) => {
    setUpdateDialog(ticket);
    setUpdateStatus(ticket.status);
    setAssignedTo(ticket.assigned_to || "");
    setResolutionNote(ticket.resolution_note || "");
  };

  const getTicketActivities = (ticketId: string) =>
    (activities || []).filter((a) => a.ticket_id === ticketId);

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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Issue Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => {
                const ticketActivities = getTicketActivities(t.id);
                const isExpanded = expandedTicket === t.id;
                return (
                  <>
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">
                        {t.ticket_number || t.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{t.title}</TableCell>
                      <TableCell className="text-sm">{t.issue_type}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${priorityColors[t.priority] || priorityColors.MEDIUM}`}>
                          {t.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColors[t.status] || statusColors.OPEN}`}>
                          {t.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.assigned_to
                          ? staffList.find((s) => s.id === t.assigned_to)
                            ? `${staffList.find((s) => s.id === t.assigned_to)?.first_name} ${staffList.find((s) => s.id === t.assigned_to)?.last_name}`
                            : "—"
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openUpdateDialog(t)}>
                            Update
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedTicket(isExpanded ? null : t.id)}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${t.id}-activity`}>
                        <TableCell colSpan={7}>
                          <div className="py-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Activity History</span>
                              <Button size="sm" variant="outline" onClick={() => setActivityDialog(t)}>
                                Add Activity
                              </Button>
                            </div>
                            {ticketActivities.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No activity recorded.</p>
                            ) : (
                              <div className="space-y-2">
                                {ticketActivities.map((a) => (
                                  <div key={a.id} className="bg-muted/50 rounded-md p-3 text-sm">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium">
                                        {a.profiles?.first_name} {a.profiles?.last_name}
                                      </span>
                                      <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{a.action}</span>
                                    <p className="mt-1">{a.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {tickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No support tickets found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Dialog */}
      <Dialog open={!!updateDialog} onOpenChange={(open) => !open && setUpdateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {updateDialog && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">{updateDialog.title}</p>
                <p className="text-sm text-muted-foreground">
                  Ticket #{updateDialog.ticket_number || updateDialog.id.slice(0, 8)} • {updateDialog.issue_type}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select value={assignedTo} onValueChange={(val: string | null) => setAssignedTo(val || "")}>
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
              <Select value={updateStatus} onValueChange={(val: string | null) => setUpdateStatus(val || "")}>
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
            <Button variant="outline" onClick={() => setUpdateDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={!!activityDialog} onOpenChange={(open) => !open && setActivityDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={activityAction} onValueChange={(val: string | null) => setActivityAction(val || "COMMENT")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMMENT">Comment</SelectItem>
                  <SelectItem value="STATUS_UPDATE">Status Update</SelectItem>
                  <SelectItem value="NOTE">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                value={activityMessage}
                onChange={(e) => setActivityMessage(e.target.value)}
                placeholder="Enter activity message..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddActivity} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
