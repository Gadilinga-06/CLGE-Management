/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Users, Plus, IndianRupee, Edit2, Clock } from "lucide-react";
import { createFeeStructure, updateFeeStructure, deleteFeeStructure, assignFeesToStudents } from "../actions";

const FEE_CATEGORIES = ["TUITION", "EXAM", "LIBRARY", "LAB", "HOSTEL", "TRANSPORT", "OTHER"];

const categoryColors: Record<string, string> = {
  TUITION: "bg-blue-100 text-blue-800",
  EXAM: "bg-purple-100 text-purple-800",
  LIBRARY: "bg-yellow-100 text-yellow-800",
  LAB: "bg-green-100 text-green-800",
  HOSTEL: "bg-orange-100 text-orange-800",
  TRANSPORT: "bg-pink-100 text-pink-800",
  OTHER: "bg-gray-100 text-gray-800",
};

export function FeeStructuresClient({ feeStructures, academicYears, courses, semesters }: {
  feeStructures: any[];
  academicYears: any[];
  courses: any[];
  semesters: any[];
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [editSelectedCourseId, setEditSelectedCourseId] = useState<string>("");

  const filteredSemesters = semesters.filter(s => s.course_id === selectedCourseId);
  const editFilteredSemesters = semesters.filter(s => s.course_id === editSelectedCourseId);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const fd = new FormData(e.currentTarget);
    const result = await createFeeStructure(fd);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Fee structure created!");
      (e.target as HTMLFormElement).reset();
      setSelectedCourseId("");
    }
    setIsCreating(false);
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateFeeStructure(editItem.id, fd);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Fee structure updated!");
      setEditItem(null);
    }
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this fee structure? Any student fees linked will remain.")) return;
    const result = await deleteFeeStructure(id);
    if (result?.error) toast.error(result.error);
    else toast.success("Deleted.");
  };

  const handleAssign = async (id: string) => {
    setAssigningId(id);
    const result = await assignFeesToStudents(id);
    if (result?.error) toast.error(result.error);
    else toast.success(`Assigned to ${result.count} student(s)!`);
    setAssigningId(null);
  };

  const renderForm = (onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>, defaultValues?: any, courseId?: string, setCourseId?: (v: string) => void, filteredSems?: any[]) => (
    <form onSubmit={onSubmit}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Fee Category</Label>
          <Select name="category" defaultValue={defaultValues?.category} required>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {FEE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Course</Label>
          <Select
            name="course_id"
            defaultValue={defaultValues?.course_id}
            required
            onValueChange={(v) => setCourseId?.(v)}
          >
            <SelectTrigger><SelectValue placeholder="Select course..." /></SelectTrigger>
            <SelectContent>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Academic Year</Label>
          <Select name="academic_year_id" defaultValue={defaultValues?.academic_year_id} required>
            <SelectTrigger><SelectValue placeholder="Select year..." /></SelectTrigger>
            <SelectContent>
              {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Semester (optional)</Label>
          <Select name="semester_id" defaultValue={defaultValues?.semester_id || ""}>
            <SelectTrigger><SelectValue placeholder="All semesters" /></SelectTrigger>
            <SelectContent>
              {(filteredSems || []).map(s => (
                <SelectItem key={s.id} value={s.id}>Sem {s.semester_number} — {s.name || `Semester ${s.semester_number}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Student Category (optional)</Label>
          <Input name="student_category" defaultValue={defaultValues?.student_category || ""} placeholder="e.g. General, SC/ST, OBC" />
        </div>
        <div className="space-y-2">
          <Label>Amount (₹)</Label>
          <Input name="amount" type="number" step="0.01" min="0" placeholder="e.g. 25000" defaultValue={defaultValues?.amount} required />
        </div>
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input name="due_date" type="date" defaultValue={defaultValues?.due_date?.split("T")[0] || ""} />
        </div>

        <div className="border-t pt-4 mt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Late Fee Configuration
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Late Fee/Day (₹)</Label>
              <Input name="late_fee_per_day" type="number" step="0.01" min="0" defaultValue={defaultValues?.late_fee_per_day || "0"} />
            </div>
            <div className="space-y-2">
              <Label>Max Late Fee (₹)</Label>
              <Input name="late_fee_max" type="number" step="0.01" min="0" defaultValue={defaultValues?.late_fee_max || "0"} />
            </div>
            <div className="space-y-2">
              <Label>Grace Days</Label>
              <Input name="grace_days" type="number" min="0" defaultValue={defaultValues?.grace_days || "0"} />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled={isCreating}>
          {defaultValues ? "Update Structure" : "Create Structure"}
        </Button>
      </CardFooter>
    </form>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create Form */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Fee Structure
          </CardTitle>
        </CardHeader>
        {renderForm(handleCreate, undefined, selectedCourseId, setSelectedCourseId, filteredSemesters)}
      </Card>

      {/* List */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>All Fee Structures</CardTitle>
          </CardHeader>
          <CardContent>
            {feeStructures.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <IndianRupee className="w-10 h-10 mx-auto mb-3 opacity-30" />
                No fee structures configured yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Sem</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Late Fee</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStructures.map(fs => (
                    <TableRow key={fs.id}>
                      <TableCell>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${categoryColors[fs.category] || categoryColors.OTHER}`}>
                          {fs.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{fs.courses?.name}</TableCell>
                      <TableCell className="text-sm">{fs.academic_years?.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fs.semester_id ? `Sem ${fs.semester_id.slice(0,4)}` : "All"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">₹{fs.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fs.due_date ? new Date(fs.due_date).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {fs.late_fee_per_day > 0 ? (
                          <Badge variant="outline" className="text-xs">₹{fs.late_fee_per_day}/day</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleAssign(fs.id)}
                            disabled={assigningId === fs.id}
                          >
                            <Users className="w-3 h-3 mr-1" />
                            {assigningId === fs.id ? "Assigning..." : "Assign"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditItem(fs);
                              setEditSelectedCourseId(fs.course_id || "");
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDelete(fs.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Fee Structure</DialogTitle>
          </DialogHeader>
          {editItem && renderForm(handleEdit, editItem, editSelectedCourseId, setEditSelectedCourseId, editFilteredSemesters)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
