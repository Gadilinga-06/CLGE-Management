/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFaculty, deleteFaculty } from "./actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export function FacultyClient({ 
  data, 
  departments,
  canCreate, 
  canDelete 
}: { 
  data: any[];
  departments: any[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = data.filter((d) => 
    d.profiles?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.profiles?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmitCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const result = await createFaculty(formData);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Faculty created successfully.");
      setIsModalOpen(false);
    }
    setIsLoading(false);
  };

  const onDelete = async () => {
    if (!selectedFaculty) return;
    setIsLoading(true);
    const result = await deleteFaculty(selectedFaculty.id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Faculty deleted successfully.");
      setIsDeleteDialogOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        {canCreate && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Faculty
          </Button>
        )}
      </div>

      <DataTable
        columns={[
          { 
            header: "Faculty Member", 
            accessor: (row) => (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={row.profiles?.avatar_url || ""} />
                  <AvatarFallback>{row.profiles?.first_name?.charAt(0)}{row.profiles?.last_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{row.profiles?.first_name} {row.profiles?.last_name}</span>
                  <span className="text-xs text-muted-foreground">{row.profiles?.email}</span>
                </div>
              </div>
            )
          },
          { header: "Employee ID", accessor: "employee_id" },
          { header: "Designation", accessor: "designation" },
          { header: "Department", accessor: (row) => row.departments?.name || "-" },
          { header: "Status", accessor: (row) => (
            row.status === "ACTIVE" ? <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge> :
            <Badge variant="outline">{row.status}</Badge>
          ) },
          { 
            header: "Actions", 
            accessor: (row) => (
              <div className="flex items-center gap-2">
                <Link href={`/faculty/${row.id}`}>
                  <Button variant="ghost" size="icon" title="View Profile">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
                {canDelete && (
                  <Button variant="ghost" size="icon" onClick={() => {
                    setSelectedFaculty(row);
                    setIsDeleteDialogOpen(true);
                  }} className="text-red-500 hover:text-red-700">
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
        searchPlaceholder="Search faculty..."
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Faculty</DialogTitle>
            <DialogDescription>
              Create a new faculty account. They will receive an email to set their password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmitCreate}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" name="first_name" required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" name="last_name" required disabled={isLoading} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required disabled={isLoading} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input id="employee_id" name="employee_id" required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input id="designation" name="designation" placeholder="e.g. Professor" required disabled={isLoading} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department_id">Department</Label>
                <Select name="department_id" disabled={isLoading}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the faculty member and their authentication account.
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
