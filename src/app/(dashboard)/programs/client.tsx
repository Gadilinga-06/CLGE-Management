"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProgram, updateProgram, deleteProgram } from "./actions";
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

type Program = Database["public"]["Tables"]["courses"]["Row"] & { departments?: { name: string } };

export function ProgramsClient({ 
  data, 
  departments,
  canCreate, 
  canUpdate, 
  canDelete 
}: { 
  data: Program[];
  departments: { id: string, name: string }[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = data.filter((d) => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (prog?: Program) => {
    setSelectedProgram(prog || null);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (prog: Program) => {
    setSelectedProgram(prog);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    let result;
    if (selectedProgram) {
      result = await updateProgram(selectedProgram.id, formData);
    } else {
      result = await createProgram(formData);
    }

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Program ${selectedProgram ? "updated" : "created"} successfully.`);
      setIsModalOpen(false);
    }
    setIsLoading(false);
  };

  const onDelete = async () => {
    if (!selectedProgram) return;
    setIsLoading(true);
    const result = await deleteProgram(selectedProgram.id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Program deleted successfully.");
      setIsDeleteDialogOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <div>
      {canCreate && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" /> Add Program
          </Button>
        </div>
      )}

      <DataTable
        columns={[
          { header: "Name", accessor: "name" },
          { header: "Code", accessor: "code" },
          { header: "Department", accessor: (row) => row.departments?.name || "Unknown" },
          { header: "Duration (Years)", accessor: "duration_years" },
          { header: "Degree Type", accessor: (row) => row.degree_type || "N/A" },
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
        searchPlaceholder="Search programs..."
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProgram ? "Edit Program" : "Add Program"}</DialogTitle>
            <DialogDescription>
              {selectedProgram ? "Update program details." : "Enter details for the new program."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name</Label>
                <Input id="name" name="name" defaultValue={selectedProgram?.name} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Program Code</Label>
                <Input id="code" name="code" defaultValue={selectedProgram?.code} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department_id">Department</Label>
                <Select name="department_id" defaultValue={selectedProgram?.department_id} required disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_years">Duration (Years)</Label>
                <Input id="duration_years" name="duration_years" type="number" min="1" max="10" defaultValue={selectedProgram?.duration_years} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="degree_type">Degree Type</Label>
                <Input id="degree_type" name="degree_type" defaultValue={selectedProgram?.degree_type || ""} placeholder="e.g. B.Tech, MBA" required disabled={isLoading} />
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
              This will permanently delete &quot;{selectedProgram?.name}&quot;.
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
