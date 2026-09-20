"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSemester, updateSemester, deleteSemester } from "./actions";
import { toast } from "sonner";
import { Database } from "@/types/database";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Semester = Database["public"]["Tables"]["semesters"]["Row"] & { courses?: { name: string, code: string } };

export function SemestersClient({ 
  data, 
  courses,
  canCreate, 
  canUpdate, 
  canDelete 
}: { 
  data: Semester[];
  courses: { id: string, name: string, code: string }[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = data.filter((d) => 
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.courses?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (sem?: Semester) => {
    setSelectedSemester(sem || null);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (sem: Semester) => {
    setSelectedSemester(sem);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    let result;
    if (selectedSemester) {
      result = await updateSemester(selectedSemester.id, formData);
    } else {
      result = await createSemester(formData);
    }

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Semester ${selectedSemester ? "updated" : "created"} successfully.`);
      setIsModalOpen(false);
    }
    setIsLoading(false);
  };

  const onDelete = async () => {
    if (!selectedSemester) return;
    setIsLoading(true);
    const result = await deleteSemester(selectedSemester.id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Semester deleted successfully.");
      setIsDeleteDialogOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <div>
      {canCreate && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" /> Add Semester
          </Button>
        </div>
      )}

      <DataTable
        columns={[
          { header: "Program", accessor: (row) => row.courses ? `${row.courses.name} (${row.courses.code})` : "Unknown" },
          { header: "Semester No.", accessor: "semester_number" },
          { header: "Name", accessor: (row) => row.name || `Semester ${row.semester_number}` },
          { 
            header: "Actions", 
            accessor: (row) => (
              <div className="flex items-center gap-2">
                {canUpdate && (
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(row)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(row)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )
          }
        ]}
        data={filteredData}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search semesters..."
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSemester ? "Edit Semester" : "Add Semester"}</DialogTitle>
            <DialogDescription>
              {selectedSemester ? "Update semester details." : "Enter details for the new semester."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="course_id">Program (Course)</Label>
                <Select name="course_id" defaultValue={selectedSemester?.course_id} required disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester_number">Semester Number</Label>
                <Input id="semester_number" name="semester_number" type="number" min="1" max="12" defaultValue={selectedSemester?.semester_number} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input id="name" name="name" defaultValue={selectedSemester?.name || ""} placeholder="e.g. Fall 2026" disabled={isLoading} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the semester.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
              e.preventDefault();
              onDelete();
            }} className="bg-red-500 hover:bg-red-600" disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
