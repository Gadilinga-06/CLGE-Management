/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { assignStudent, removeAssignment } from "../actions";
import { UserPlus, Trash2 } from "lucide-react";

export function AssignmentsClient({ assignments, routes, students, academicYearId }: {
  assignments: any[];
  routes: any[];
  students: any[];
  academicYearId: string;
}) {
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [routeStops, setRouteStops] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRouteChange = async (routeId: string) => {
    setSelectedRoute(routeId);
    const route = routes.find((r: any) => r.id === routeId);
    if (route) {
      // Fetch stops for this route
      const res = await fetch(`/api/stops?route_id=${routeId}`);
      // Fallback: use client-side data
    }
  };

  const handleAssign = async () => {
    const form = document.getElementById("assign-form") as HTMLFormElement;
    if (!form) return;
    const fd = new FormData(form);
    setIsSubmitting(true);
    const result = await assignStudent({
      student_id: fd.get("student_id") as string,
      route_id: fd.get("route_id") as string,
      stop_id: fd.get("stop_id") as string,
      academic_year_id: academicYearId,
    });
    if (result?.error) toast.error(result.error);
    else { toast.success("Student assigned!"); setAssignDialog(false); }
    setIsSubmitting(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this assignment?")) return;
    const result = await removeAssignment(id);
    if (result?.error) toast.error(result.error);
    else toast.success("Assignment removed.");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAssignDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Assign Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Assignments ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission #</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Bus</TableHead>
                <TableHead>Stop</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.students?.profiles?.first_name} {a.students?.profiles?.last_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.students?.admission_number}</TableCell>
                  <TableCell>{a.routes?.name}</TableCell>
                  <TableCell className="text-sm">{a.routes?.buses?.registration_number || "—"}</TableCell>
                  <TableCell>{a.bus_stops?.name}</TableCell>
                  <TableCell className="text-sm">{a.bus_stops?.pickup_time}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleRemove(a.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {assignments.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No active assignments.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Student to Transport</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4" id="assign-form">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select name="student_id" required>
                <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.profiles?.first_name} {s.profiles?.last_name} ({s.admission_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Route *</Label>
              <Select name="route_id" required onValueChange={val => setSelectedRoute(val as string)}>
                <SelectTrigger><SelectValue placeholder="Select route..." /></SelectTrigger>
                <SelectContent>
                  {routes.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.buses?.registration_number || "No bus"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stop *</Label>
              <Select name="stop_id" required>
                <SelectTrigger><SelectValue placeholder="Select stop..." /></SelectTrigger>
                <SelectContent>
                  {routeStops.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.pickup_time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={isSubmitting}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
