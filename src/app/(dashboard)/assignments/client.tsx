/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createAssignment, updateAssignment, publishAssignment, deleteAssignment, gradeSubmission } from "./actions";
import {
  Plus,
  Pencil,
  Trash2,
  Send,
  Eye,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Star,
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

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PUBLISHED: "bg-green-100 text-green-800 border-green-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};

export function AssignmentsClient({
  assignments,
  subjects,
  sections,
  facultyAssignments,
  submissionCounts,
  submissions,
  userId,
}: {
  assignments: any[];
  subjects: any[];
  sections: any[];
  facultyAssignments: any[];
  submissionCounts: Record<string, number>;
  submissions: any[];
  userId: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [gradeDialog, setGradeDialog] = useState<any>(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getSubjectName = (a: any) => a.subjects?.name || "Unknown";
  const getSectionName = (a: any) => a.sections?.name || "Unknown";

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await createAssignment(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Assignment created successfully");
      setCreateOpen(false);
      (e.target as HTMLFormElement).reset();
    }
    setIsSubmitting(false);
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const id = formData.get("id") as string;
    const result = await updateAssignment(id, formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Assignment updated successfully");
      setEditOpen(false);
    }
    setIsSubmitting(false);
  };

  const handlePublish = async (id: string) => {
    const result = await publishAssignment(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Assignment published");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteAssignment(deleteId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Assignment deleted");
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const handleGrade = async () => {
    if (!gradeDialog) return;
    const marks = parseFloat(gradeMarks);
    if (isNaN(marks) || marks < 0) {
      toast.error("Enter valid marks");
      return;
    }
    const result = await gradeSubmission(gradeDialog.id, marks, gradeFeedback);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Submission graded successfully");
      setGradeDialog(null);
      setGradeMarks("");
      setGradeFeedback("");
    }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isPastDeadline = (deadline: string) => new Date() > new Date(deadline);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Assignment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Max Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No assignments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((a) => (
                    <>
                      <TableRow key={a.id} className="cursor-pointer" onClick={() => setExpandedRow(expandedRow === a.id ? null : a.id)}>
                        <TableCell className="font-medium max-w-[200px] truncate">{a.title}</TableCell>
                        <TableCell>{getSubjectName(a)}</TableCell>
                        <TableCell>{getSectionName(a)}</TableCell>
                        <TableCell className={isPastDeadline(a.deadline) ? "text-red-600" : ""}>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(a.deadline)}
                          </div>
                        </TableCell>
                        <TableCell>{a.max_marks || "—"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColors[a.status] || "bg-gray-100 text-gray-600"}`}>
                            {a.status}
                          </span>
                        </TableCell>
                        <TableCell>{submissionCounts[a.id] || 0}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {a.status === "DRAFT" && (
                              <Button variant="ghost" size="sm" onClick={() => handlePublish(a.id)}>
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setDeleteId(a.id); setDeleteOpen(true); }}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setExpandedRow(expandedRow === a.id ? null : a.id)}>
                              {expandedRow === a.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRow === a.id && (
                        <TableRow key={`${a.id}-expanded`}>
                          <TableCell colSpan={8} className="bg-muted/30 p-4">
                            {a.description && (
                              <p className="text-sm text-muted-foreground mb-3">{a.description}</p>
                            )}
                            <div className="text-sm font-medium mb-2">
                              Submissions ({(submissions.filter((s) => s.assignment_id === a.id).length)})
                            </div>
                            {submissions.filter((s) => s.assignment_id === a.id).length === 0 ? (
                              <p className="text-sm text-muted-foreground">No submissions yet.</p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Admission No</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead>Marks</TableHead>
                                    <TableHead>Feedback</TableHead>
                                    <TableHead>Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {submissions
                                    .filter((s) => s.assignment_id === a.id)
                                    .map((s) => (
                                      <TableRow key={s.id}>
                                        <TableCell>
                                          {s.students?.profiles?.first_name} {s.students?.profiles?.last_name}
                                        </TableCell>
                                        <TableCell>{s.students?.admission_number}</TableCell>
                                        <TableCell>{formatDate(s.submitted_at)}</TableCell>
                                        <TableCell>
                                          {s.marks_obtained !== null ? (
                                            <span className="font-medium text-green-700">
                                              {s.marks_obtained} / {a.max_marks || "—"}
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground">—</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="max-w-[150px] truncate text-sm">{s.feedback || "—"}</TableCell>
                                        <TableCell>
                                          <div className="flex gap-1">
                                            {s.submission_url && (
                                              <a
                                                href={s.submission_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors"
                                              >
                                                <ExternalLink className="w-3 h-3" />
                                              </a>
                                            )}
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setGradeDialog(s);
                                                setGradeMarks(s.marks_obtained?.toString() || "");
                                                setGradeFeedback(s.feedback || "");
                                              }}
                                            >
                                              <Star className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Assignment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <input type="hidden" name="faculty_id" value={facultyAssignments[0]?.id || ""} />
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input name="title" required placeholder="Assignment title" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" placeholder="Assignment description (optional)" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select name="subject_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {facultyAssignments.map((fa: any) => (
                        <SelectItem key={fa.subjects?.id} value={fa.subjects?.id || ""}>
                          {fa.subjects?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select name="section_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {facultyAssignments.map((fa: any) => (
                        <SelectItem key={fa.sections?.id} value={fa.sections?.id || ""}>
                          {fa.sections?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input name="deadline" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <Label>Max Marks</Label>
                  <Input name="max_marks" type="number" step="0.01" min="0" placeholder="100" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Allow Late Submission</Label>
                <Select name="allow_late_submission" defaultValue="false">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue="DRAFT">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Assignment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <input type="hidden" name="id" value={expandedRow || ""} />
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input name="title" required defaultValue={assignments.find((a) => a.id === expandedRow)?.title} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  defaultValue={assignments.find((a) => a.id === expandedRow)?.description || ""}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input
                    name="deadline"
                    type="datetime-local"
                    required
                    defaultValue={assignments
                      .find((a) => a.id === expandedRow)
                      ?.deadline?.slice(0, 16)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Marks</Label>
                  <Input
                    name="max_marks"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={assignments.find((a) => a.id === expandedRow)?.max_marks || ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Allow Late Submission</Label>
                <Select
                  name="allow_late_submission"
                  defaultValue={assignments.find((a) => a.id === expandedRow)?.allow_late_submission?.toString() || "false"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={assignments.find((a) => a.id === expandedRow)?.status || "DRAFT"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
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

      {/* Grade Submission Dialog */}
      <Dialog open={!!gradeDialog} onOpenChange={(open) => !open && setGradeDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {gradeDialog && (
              <p className="text-sm text-muted-foreground">
                {gradeDialog.students?.profiles?.first_name} {gradeDialog.students?.profiles?.last_name} —{" "}
                {gradeDialog.students?.admission_number}
              </p>
            )}
            <div className="space-y-2">
              <Label>Marks Obtained</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={gradeMarks}
                onChange={(e) => setGradeMarks(e.target.value)}
                placeholder="Enter marks"
              />
            </div>
            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Optional feedback for the student"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleGrade}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
