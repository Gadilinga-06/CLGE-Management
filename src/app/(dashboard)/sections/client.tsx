/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSection, updateSection, deleteSection } from "./actions";
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

type Section = Database["public"]["Tables"]["sections"]["Row"] & { 
  semesters?: { semester_number: number, courses?: { name: string, code: string } } 
};

export function SectionsClient({ 
  data, 
  semesters,
  canCreate, 
  canUpdate, 
  canDelete 
}: { 
  data: Section[];
  semesters: { id: string, semester_number: number, courses?: { name: string, code: string } }[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = data.filter((d) => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (sec?: Section) => {
    setSelectedSection(sec || null);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (sec: Section) => {
    setSelectedSection(sec);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    let result;
    if (selectedSection) {
      result = await updateSection(selectedSection.id, formData);
    } else {
      result = await createSection(formData);
    }

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Section ${selectedSection ? "updated" : "created"} successfully.`);
      setIsModalOpen(false);
    }
    setIsLoading(false);
  };

  const onDelete = async () => {
    if (!selectedSection) return;
    setIsLoading(true);
    const result = await deleteSection(selectedSection.id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Section deleted successfully.");
      setIsDeleteDialogOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <div>
      {canCreate && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" /> Add Section
          </Button>
        </div>
      )}

      <DataTable
        columns={[
          { header: "Name", accessor: "name" },
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
        searchPlaceholder="Search sections..."
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSection ? "Edit Section" : "Add Section"}</DialogTitle>
            <DialogDescription>
              {selectedSection ? "Update section details." : "Enter details for the new section."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="semester_id">Program / Semester</Label>
                <Select name="semester_id" defaultValue={selectedSection?.semester_id} required disabled={isLoading}>
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
                <Label htmlFor="name">Section Name</Label>
                <Input id="name" name="name" defaultValue={selectedSection?.name} placeholder="e.g. Section A" required disabled={isLoading} />
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
              This will permanently delete the section.
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

