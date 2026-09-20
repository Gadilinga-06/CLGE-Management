/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createNotice, deleteNotice } from "../assignments/actions";
import {
  Plus,
  Trash2,
  Bell,
  Calendar,
  Building2,
  GraduationCap,
  Users,
  Megaphone,
  AlertTriangle,
  PartyPopper,
  BookOpen,
  Briefcase,
  Sun,
} from "lucide-react";
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

const categoryConfig: Record<string, { label: string; className: string; icon: any }> = {
  GENERAL: { label: "General", className: "bg-blue-100 text-blue-800 border-blue-200", icon: Bell },
  ACADEMIC: { label: "Academic", className: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: BookOpen },
  EXAM: { label: "Exam", className: "bg-purple-100 text-purple-800 border-purple-200", icon: GraduationCap },
  DEPARTMENT: { label: "Department", className: "bg-cyan-100 text-cyan-800 border-cyan-200", icon: Building2 },
  PLACEMENT: { label: "Placement", className: "bg-orange-100 text-orange-800 border-orange-200", icon: Briefcase },
  HOLIDAY: { label: "Holiday", className: "bg-green-100 text-green-800 border-green-200", icon: Sun },
  EMERGENCY: { label: "Emergency", className: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle },
  EVENT: { label: "Event", className: "bg-pink-100 text-pink-800 border-pink-200", icon: PartyPopper },
};

export function NoticesClient({
  notices,
  canCreate,
  departments,
  courses,
  semesters,
  sections,
  userId,
}: {
  notices: any[];
  canCreate: boolean;
  departments: any[];
  courses: any[];
  semesters: any[];
  sections: any[];
  userId: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await createNotice(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Notice created successfully");
      setCreateOpen(false);
      (e.target as HTMLFormElement).reset();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteNotice(deleteId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Notice deleted");
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getTargetingInfo = (notice: any) => {
    const parts: string[] = [];
    if (notice.department_id && notice.departments?.name) {
      parts.push(`Dept: ${notice.departments.name}`);
    }
    if (notice.course_id && notice.courses?.name) {
      parts.push(`Course: ${notice.courses.name}`);
    }
    if (notice.semester_id && notice.semesters?.semester_number) {
      parts.push(`Sem ${notice.semesters.semester_number}`);
    }
    if (notice.section_id && notice.sections?.name) {
      parts.push(`Section: ${notice.sections.name}`);
    }
    if (notice.target_role) {
      parts.push(`Role: ${notice.target_role}`);
    }
    return parts.length > 0 ? parts.join(" • ") : "All";
  };

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Notice
          </Button>
        </div>
      )}

      {notices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No notices available</p>
              <p className="text-sm">Check back later for updates.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notices.map((notice) => {
            const catConfig = categoryConfig[notice.category] || categoryConfig.GENERAL;
            const CatIcon = catConfig.icon;

            return (
              <Card key={notice.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${catConfig.className}`}>
                        <CatIcon className="w-3 h-3 mr-1" />
                        {catConfig.label}
                      </span>
                    </div>
                    {canCreate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setDeleteId(notice.id); setDeleteOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-2">{notice.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{notice.content}</p>
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{getTargetingInfo(notice)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(notice.created_at)}</span>
                    </div>
                    {notice.profiles && (
                      <div className="text-xs text-muted-foreground">
                        Posted by: {notice.profiles.first_name} {notice.profiles.last_name}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Notice Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Notice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input name="title" required placeholder="Notice title" />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea name="content" required placeholder="Notice content" rows={5} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select name="category" defaultValue="GENERAL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Role (optional)</Label>
                <Select name="target_role">
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="STUDENT">Students</SelectItem>
                    <SelectItem value="FACULTY">Faculty</SelectItem>
                    <SelectItem value="PARENT">Parents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department (optional)</Label>
                  <Select name="department_id">
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Course (optional)</Label>
                  <Select name="course_id">
                    <SelectTrigger>
                      <SelectValue placeholder="All courses" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Semester (optional)</Label>
                  <Select name="semester_id">
                    <SelectTrigger>
                      <SelectValue placeholder="All semesters" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          Semester {s.semester_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section (optional)</Label>
                  <Select name="section_id">
                    <SelectTrigger>
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Notice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
