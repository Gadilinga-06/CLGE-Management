"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAcademicYear, updateAcademicYear, deleteAcademicYear } from "./actions";
import { toast } from "sonner";
import { Database } from "@/types/database";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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

type AcademicYear = Database["public"]["Tables"]["academic_years"]["Row"];

export function AcademicYearsClient({ 
  data, 
  canManage 
}: { 
  data: AcademicYear[];
  canManage: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAY, setSelectedAY] = useState<AcademicYear | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = data.filter((d) => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (ay?: AcademicYear) => {
    setSelectedAY(ay || null);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (ay: AcademicYear) => {
    setSelectedAY(ay);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    let result;
    if (selectedAY) {
      result = await updateAcademicYear(selectedAY.id, formData);
    } else {
      result = await createAcademicYear(formData);
    }

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Academic Year ${selectedAY ? "updated" : "created"} successfully.`);
      setIsModalOpen(false);
    }
    setIsLoading(false);
  };

  const onDelete = async () => {
    if (!selectedAY) return;
    setIsLoading(true);
    const result = await deleteAcademicYear(selectedAY.id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Academic Year deleted successfully.");
      setIsDeleteDialogOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <div>
      {canManage && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" /> Add Academic Year
          </Button>
        </div>
      )}

      <DataTable
        columns={[
          { header: "Name", accessor: "name" },
          { header: "Start Date", accessor: (row) => new Date(row.start_date).toLocaleDateString() },
          { header: "End Date", accessor: (row) => new Date(row.end_date).toLocaleDateString() },
          { header: "Status", accessor: (row) => row.is_active ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge> },
          { 
            header: "Actions", 
            accessor: (row) => (
              <div className="flex items-center gap-2">
                {canManage && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(row)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(row)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            )
          }
        ]}
        data={filteredData}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search academic years..."
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAY ? "Edit Academic Year" : "Add Academic Year"}</DialogTitle>
            <DialogDescription>
              {selectedAY ? "Update details." : "Enter details for the new academic year."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={selectedAY?.name} placeholder="e.g. 2026-2027" required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" name="start_date" type="date" defaultValue={selectedAY?.start_date ? selectedAY.start_date.split('T')[0] : ''} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" name="end_date" type="date" defaultValue={selectedAY?.end_date ? selectedAY.end_date.split('T')[0] : ''} required disabled={isLoading} />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="is_active" name="is_active" defaultChecked={selectedAY?.is_active} disabled={isLoading} />
                <Label htmlFor="is_active">Set as Active Academic Year</Label>
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
              This will permanently delete &quot;{selectedAY?.name}&quot;.
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
