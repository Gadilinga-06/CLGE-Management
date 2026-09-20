"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSubject, updateSubject, deleteSubject } from "./actions";
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

type Subject = Database["public"]["Tables"]["subjects"]["Row"] & { 
  semesters?: { semester_number: number, courses?: { name: string, code: string } } 
};

export function SubjectsClient({ 
  data, 
  semesters,
  canCreate, 
  canUpdate, 
  canDelete 
}: { 
  data: Subject[];
  semesters: { id: string, semester_number: number, courses?: { name: string, code: string } }[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = data.filter((d) => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (subj?: Subject) => {
    setSelectedSubject(subj || null);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (subj: Subject) => {
    setSelectedSubject(subj);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    let result;
    if (selectedSubject) {
      result = await updateSubject(selectedSubject.id, formData);
    } else {
      result = await createSubject(formData);
    }

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Subject ${selectedSubject ? "updated" : "created"} successfully.`);
      setIsModalOpen(false);
    }
    setIsLoading(false);
  };

  const onDelete = async () => {
    if (!selectedSubject) return;
    setIsLoading(true);
    const result = await deleteSubject(selectedSubject.id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Subject deleted successfully.");
      setIsDeleteDialogOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <div>
      {canCreate && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" /> Add Subject
          </Button>
        </div>
      )}

      <DataTable
        columns={[
          { header: "Name", accessor: "name" },
          { header: "Code", accessor: "code" },
          { header: "Credits", accessor: "credits" },
          { header: "Type", accessor: "type" },
          { 
            header: "Program (Semester)", 
            accessor: (row) => row.semesters ? 
              `${row.semesters.courses?.name} - Sem ${row.semesters.semester_number}` : 
              "Unknown" 
          },
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
        searchPlaceholder="Search subjects..."
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
            <DialogDescription>
              {selectedSubject ? "Update subject details." : "Enter details for the new subject."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="semester_id">Program / Semester</Label>
                <Select name="semester_id" defaultValue={selectedSubject?.semester_id} required disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.courses?.name} ({s.courses?.code}) - Sem {s.semester_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input id="name" name="name" defaultValue={selectedSubject?.name} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Subject Code</Label>
                <Input id="code" name="code" defaultValue={selectedSubject?.code} required disabled={isLoading} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits</Label>
                  <Input id="credits" name="credits" type="number" min="1" max="10" defaultValue={selectedSubject?.credits} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" defaultValue={selectedSubject?.type || "CORE"} required disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CORE">CORE</SelectItem>
                      <SelectItem value="ELECTIVE">ELECTIVE</SelectItem>
                      <SelectItem value="LAB">LAB</SelectItem>
                      <SelectItem value="PROJECT">PROJECT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              This will permanently delete the subject.
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
