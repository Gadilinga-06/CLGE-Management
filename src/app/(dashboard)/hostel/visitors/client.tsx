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
import { logVisitor, checkOutVisitor } from "../actions";
import { UserPlus, LogOut } from "lucide-react";

export function VisitorsClient({ visitors, hostels, students }: { visitors: any[]; hostels: any[]; students: any[] }) {
  const [logDialog, setLogDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState("CHECKED_IN");

  const filtered = visitors.filter(v => filter === "ALL" || v.status === filter);
  const checkedIn = visitors.filter(v => v.status === "CHECKED_IN").length;

  const handleLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await logVisitor(new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Visitor logged!"); setLogDialog(false); }
    setIsSubmitting(false);
  };

  const handleCheckOut = async (id: string) => {
    const result = await checkOutVisitor(id);
    if (result?.error) toast.error(result.error);
    else toast.success("Visitor checked out.");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {checkedIn > 0 && (
            <div className="px-3 py-2 bg-green-50 rounded-md text-sm font-medium text-green-700">
              {checkedIn} visitor{checkedIn > 1 ? "s" : ""} currently inside
            </div>
          )}
          <Select value={filter} onValueChange={val => setFilter(val as string)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Visitors</SelectItem>
              <SelectItem value="CHECKED_IN">Checked In</SelectItem>
              <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setLogDialog(true)}><UserPlus className="w-4 h-4 mr-2" /> Log Visitor</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Visitor Log ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Relation</TableHead>
                <TableHead>Meeting</TableHead>
                <TableHead>Hostel</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.visitor_name}</TableCell>
                  <TableCell className="text-sm">{v.visitor_phone || "—"}</TableCell>
                  <TableCell className="text-sm">{v.relation || "—"}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{v.students?.profiles?.first_name} {v.students?.profiles?.last_name}</div>
                    <div className="text-xs text-muted-foreground">{v.students?.admission_number}</div>
                  </TableCell>
                  <TableCell className="text-sm">{v.hostels?.name}</TableCell>
                  <TableCell className="text-sm">{new Date(v.check_in_time).toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{v.check_out_time ? new Date(v.check_out_time).toLocaleString() : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === "CHECKED_IN" ? "secondary" : "default"} className={v.status === "CHECKED_IN" ? "bg-green-100 text-green-800" : ""}>{v.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {v.status === "CHECKED_IN" && (
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleCheckOut(v.id)}>
                        <LogOut className="w-3 h-3 mr-1" /> Check Out
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">No visitor records found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={logDialog} onOpenChange={setLogDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log New Visitor</DialogTitle></DialogHeader>
          <form onSubmit={handleLog}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2 col-span-2">
                <Label>Visitor Name *</Label>
                <Input name="visitor_name" required placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="visitor_phone" placeholder="Contact number" />
              </div>
              <div className="space-y-2">
                <Label>Relation</Label>
                <Select name="relation">
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PARENT">Parent</SelectItem>
                    <SelectItem value="SIBLING">Sibling</SelectItem>
                    <SelectItem value="RELATIVE">Relative</SelectItem>
                    <SelectItem value="FRIEND">Friend</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Student Being Visited *</Label>
                <Select name="student_id" required>
                  <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.profiles?.first_name} {s.profiles?.last_name} ({s.admission_number})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hostel *</Label>
                <Select name="hostel_id" required>
                  <SelectTrigger><SelectValue placeholder="Select hostel..." /></SelectTrigger>
                  <SelectContent>
                    {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Purpose</Label>
                <Input name="purpose" placeholder="Reason for visit..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLogDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Log Entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
