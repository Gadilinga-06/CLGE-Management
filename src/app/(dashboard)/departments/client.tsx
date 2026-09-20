"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDepartment, updateDepartment, deleteDepartment } from "./actions";
import { toast } from "sonner";
import { Database } from "@/types/database";
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

type Department = Database["public"]["Tables"]["departments"]["Row"];

export function DepartmentsClient({ 
  data, 
  canCreate, 
  canUpdate, 
  canDelete 
}: { 
  data: Department[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = data.filter((d) => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (dept?: Department) => {
    setSelectedDept(dept || null);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (dept: Department) => {
    setSelectedDept(dept);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    let result;
    if (selectedDept) {
      result = await updateDepartment(selectedDept.id, formData);
    } else {
      result = await createDepartment(formData);
    }

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Department ${selectedDept ? "updated" : "created"} successfully.`);
      setIsModalOpen(false);
    }
    setIsLoading(false);
  };

  const onDelete = async () => {
    if (!selectedDept) return;
    setIsLoading(true);
    const result = await deleteDepartment(selectedDept.id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Department deleted successfully.");
      setIsDeleteDialogOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <div>
      {canCreate && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" /> Add Department
          </Button>
        </div>
      )}

      <DataTable
        columns={[
          { header: "Name", accessor: "name" },
          { header: "Code", accessor: "code" },
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
        searchPlaceholder="Search departments..."
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDept ? "Edit Department" : "Add Department"}</DialogTitle>
            <DialogDescription>
              {selectedDept ? "Update the department details below." : "Enter the details for the new department."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name</Label>
                <Input id="name" name="name" defaultValue={selectedDept?.name} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Department Code</Label>
                <Input id="code" name="code" defaultValue={selectedDept?.code} required disabled={isLoading} />
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
              This action cannot be undone. This will permanently delete the 
              department &quot;{selectedDept?.name}&quot; and may affect associated courses and faculty.
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
