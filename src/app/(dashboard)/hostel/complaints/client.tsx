/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateComplaintStatus } from "../actions";
import { AlertCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  OPEN: "bg-red-100 text-red-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

export function ComplaintsClient({ complaints }: { complaints: any[] }) {
  const [filter, setFilter] = useState("ALL");
  const [detail, setDetail] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");

  const filtered = complaints.filter(c => filter === "ALL" || c.status === filter);
  const openCount = complaints.filter(c => c.status === "OPEN").length;

  const handleUpdate = async () => {
    if (!newStatus || !detail) return;
    const result = await updateComplaintStatus(detail.id, newStatus);
    if (result?.error) toast.error(result.error);
    else { toast.success("Status updated."); setDetail(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {openCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">{openCount} open complaint{openCount > 1 ? "s" : ""}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Select value={filter} onValueChange={val => setFilter(val as string)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Complaints ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Hostel</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Filed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.students?.profiles?.first_name} {c.students?.profiles?.last_name}</TableCell>
                  <TableCell>{c.hostels?.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{c.category}</Badge></TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[c.status] || statusColors.CLOSED}`}>{c.status}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setDetail(c); setNewStatus(c.status); }}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No complaints found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={open => !open && setDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{detail?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Student:</span> <span className="font-medium">{detail?.students?.profiles?.first_name} {detail?.students?.profiles?.last_name}</span></div>
              <div><span className="text-muted-foreground">Hostel:</span> {detail?.hostels?.name}</div>
              <div><span className="text-muted-foreground">Category:</span> {detail?.category}</div>
              <div><span className="text-muted-foreground">Filed:</span> {detail ? new Date(detail.created_at).toLocaleString() : ""}</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-md text-sm">{detail?.description}</div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Update Status</span>
              <Select value={newStatus} onValueChange={val => setNewStatus(val as string)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>Close</Button>
            <Button onClick={handleUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
