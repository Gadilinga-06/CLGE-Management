/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Eye, Download, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStudent, deleteStudent } from "./actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BulkImportModal } from "@/components/students/bulk-import-modal";
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
import Papa from "papaparse";
import { useRouter } from "next/navigation";

export function StudentsClient({
  data,
  departments,
  canCreate,
  canUpdate,
  canDelete,
  currentPage,
  totalPages,
  totalItems,
}: {
  data: any[];
  departments?: any[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = data.filter((d) => 
    d.profiles?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.profiles?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.admission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    const csvData = data.map((d) => ({
      AdmissionNumber: d.admission_number,
      FirstName: d.profiles?.first_name,
      LastName: d.profiles?.last_name,
      Email: d.profiles?.email,
      Phone: d.profiles?.phone,
      Department: d.departments?.name || "",
      Program: d.courses?.name || "",
      Status: d.status
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "students_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onSubmitCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const result = await createStudent(formData);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Student created successfully.");
      setIsModalOpen(false);
    }
    setIsLoading(false);
  };

  const onDelete = async () => {
    if (!selectedStudent) return;
    setIsLoading(true);
    const result = await deleteStudent(selectedStudent.id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Student deleted successfully.");
      setIsDeleteDialogOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
        {canCreate && (
          <>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" /> Bulk Import
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Student
            </Button>
          </>
        )}
      </div>

      <DataTable
        columns={[
          { 
            header: "Student", 
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
          { header: "Admission No", accessor: "admission_number" },
          { header: "Program", accessor: (row) => row.courses?.name || "-" },
          { header: "Status", accessor: (row) => (
            row.status === "ACTIVE" ? <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge> :
            <Badge variant="outline">{row.status}</Badge>
          ) },
          { 
            header: "Actions", 
            accessor: (row) => (
              <div className="flex items-center gap-2">
                <Link href={`/students/${row.id}`}>
                  <Button variant="ghost" size="icon" title="View Profile">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
                {canDelete && (
                  <Button variant="ghost" size="icon" onClick={() => {
                    setSelectedStudent(row);
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
        searchPlaceholder="Search students..."
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
            <DialogDescription>
              Create a new student account. They will receive an email to set their password.
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
              <div className="space-y-2">
                <Label htmlFor="admission_number">Admission Number</Label>
                <Input id="admission_number" name="admission_number" required disabled={isLoading} />
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
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student and their authentication account. This action cannot be undone.
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

      <BulkImportModal open={isImportModalOpen} onOpenChange={setIsImportModalOpen} />

      {/* Server-side Pagination */}
      {totalPages && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage || 1) - 1) * 50 + 1} to {Math.min((currentPage || 1) * 50, totalItems || 0)} of {totalItems || 0} students
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(currentPage || 1) <= 1}
              onClick={() => router.push(`/students?page=${(currentPage || 1) - 1}`)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage || 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={(currentPage || 1) >= totalPages}
              onClick={() => router.push(`/students?page=${(currentPage || 1) + 1}`)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

