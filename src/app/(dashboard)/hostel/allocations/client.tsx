/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { allocateBed, vacateBed, transferBed } from "../actions";
import { BedDouble, Plus } from "lucide-react";

export function AllocationsClient({ allocations, availableBeds, students, academicYears }: {
  allocations: any[]; availableBeds: any[]; students: any[]; academicYears: any[];
}) {
  const [tab, setTab] = useState<"active" | "all">("active");
  const [allocDialog, setAllocDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const activeAllocations = allocations.filter(a => a.status === "ALLOCATED");
  const display = (tab === "active" ? activeAllocations : allocations).filter(a => {
    if (!search) return true;
    const name = `${a.students?.profiles?.first_name} ${a.students?.profiles?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || a.students?.admission_number?.includes(search);
  });

  const handleAllocate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = await allocateBed({
      bed_id: fd.get("bed_id") as string,
      student_id: fd.get("student_id") as string,
      academic_year_id: fd.get("academic_year_id") as string,
      notes: fd.get("notes") as string || undefined,
    });
    if (result?.error) toast.error(result.error);
    else { toast.success("Bed allocated!"); setAllocDialog(false); }
    setIsSubmitting(false);
  };

  const handleVacate = async (id: string) => {
    if (!confirm("Vacate this bed? The student will be removed from this allocation.")) return;
    const result = await vacateBed(id);
    if (result?.error) toast.error(result.error);
    else toast.success("Bed vacated.");
  };

  const handleTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = await transferBed({
      allocationId: transferDialog.id,
      newBedId: fd.get("new_bed_id") as string,
      notes: fd.get("notes") as string || undefined,
    });
    if (result?.error) toast.error(result.error);
    else { toast.success("Student transferred!"); setTransferDialog(null); }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["active", "all"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              {t === "active" ? `Active (${activeAllocations.length})` : `All (${allocations.length})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          <Button onClick={() => setAllocDialog(true)}><Plus className="w-4 h-4 mr-2" /> Allocate Bed</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Hostel / Block / Room / Bed</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Allotted On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {display.map(a => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="font-medium">{a.students?.profiles?.first_name} {a.students?.profiles?.last_name}</div>
                    <div className="text-xs text-muted-foreground">{a.students?.admission_number}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {a.hostel_beds?.hostel_rooms?.hostel_blocks?.hostels?.name} →{" "}
                      {a.hostel_beds?.hostel_rooms?.hostel_blocks?.name} →{" "}
                      Room {a.hostel_beds?.hostel_rooms?.room_number} → Bed {a.hostel_beds?.bed_number}
                    </div>
                    {a.hostel_beds?.hostel_rooms?.monthly_rent > 0 && (
                      <div className="text-xs text-muted-foreground">₹{a.hostel_beds.hostel_rooms.monthly_rent}/month</div>
                    )}
                  </TableCell>
                  <TableCell>{a.academic_years?.year_range}</TableCell>
                  <TableCell className="text-sm">{new Date(a.allocation_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "ALLOCATED" ? "secondary" : "outline"} className={a.status === "ALLOCATED" ? "bg-green-100 text-green-800" : ""}>{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {a.status === "ALLOCATED" && (
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setTransferDialog(a)}>Transfer</Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-500" onClick={() => handleVacate(a.id)}>Vacate</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {display.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10">
                  <BedDouble className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <span className="text-muted-foreground">No allocations found.</span>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Allocate Dialog */}
      <Dialog open={allocDialog} onOpenChange={setAllocDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Allocate Bed to Student</DialogTitle></DialogHeader>
          <form onSubmit={handleAllocate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Student</Label>
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
                <Label>Available Bed</Label>
                <Select name="bed_id" required>
                  <SelectTrigger><SelectValue placeholder="Select bed..." /></SelectTrigger>
                  <SelectContent>
                    {availableBeds.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.hostel_rooms?.hostel_blocks?.hostels?.name} → {b.hostel_rooms?.hostel_blocks?.name} → Room {b.hostel_rooms?.room_number} → {b.bed_number}
                        {b.hostel_rooms?.monthly_rent > 0 ? ` (₹${b.hostel_rooms.monthly_rent}/mo)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select name="academic_year_id" required>
                  <SelectTrigger><SelectValue placeholder="Select year..." /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.year_range}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Notes (optional)</Label><Input name="notes" placeholder="Any special requirements..." /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAllocDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Allocate</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={!!transferDialog} onOpenChange={open => !open && setTransferDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transfer Student</DialogTitle></DialogHeader>
          <form onSubmit={handleTransfer}>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/30 rounded-md text-sm">
                <div><span className="text-muted-foreground">Student:</span> <span className="font-medium">{transferDialog?.students?.profiles?.first_name} {transferDialog?.students?.profiles?.last_name}</span></div>
                <div><span className="text-muted-foreground">Current:</span> Room {transferDialog?.hostel_beds?.hostel_rooms?.room_number} → Bed {transferDialog?.hostel_beds?.bed_number}</div>
              </div>
              <div className="space-y-2">
                <Label>New Bed</Label>
                <Select name="new_bed_id" required>
                  <SelectTrigger><SelectValue placeholder="Select available bed..." /></SelectTrigger>
                  <SelectContent>
                    {availableBeds.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.hostel_rooms?.hostel_blocks?.name} → Room {b.hostel_rooms?.room_number} → {b.bed_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Reason for Transfer</Label><Input name="notes" placeholder="Transfer reason..." /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTransferDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Transfer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
