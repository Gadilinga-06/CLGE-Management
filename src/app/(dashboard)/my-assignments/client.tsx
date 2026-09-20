/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitAssignment } from "../assignments/actions";
import {
  FileText,
  Clock,
  CheckCircle,
  ExternalLink,
  Send,
  AlertCircle,
  Calendar,
  BookOpen,
  LinkIcon,
} from "lucide-react";

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  DRAFT: { label: "Draft", className: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: FileText },
  PUBLISHED: { label: "Published", className: "bg-green-100 text-green-800 border-green-200", icon: Send },
  CLOSED: { label: "Closed", className: "bg-gray-100 text-gray-600 border-gray-200", icon: AlertCircle },
};

export function MyAssignmentsClient({
  assignments,
  mySubmissions,
  studentId,
}: {
  assignments: any[];
  mySubmissions: any[];
  studentId: string;
}) {
  const [submitDialog, setSubmitDialog] = useState<any>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getSubmission = (assignmentId: string) =>
    mySubmissions.find((s) => s.assignment_id === assignmentId);

  const handleSubmit = async () => {
    if (!submitDialog) return;
    if (!submissionUrl.trim()) {
      toast.error("Please enter a submission URL");
      return;
    }

    setIsSubmitting(true);
    const result = await submitAssignment({
      assignment_id: submitDialog.id,
      submission_url: submissionUrl.trim(),
    });

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Assignment submitted successfully");
      setSubmitDialog(null);
      setSubmissionUrl("");
    }
    setIsSubmitting(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const isOverdue = (deadline: string) => new Date() > new Date(deadline);
  const canSubmit = (assignment: any) => {
    const sub = getSubmission(assignment.id);
    if (assignment.status === "CLOSED") return false;
    if (isOverdue(assignment.deadline) && !assignment.allow_late_submission && !sub) return false;
    return true;
  };

  return (
    <div className="space-y-4">
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No assignments available</p>
              <p className="text-sm">Check back later for new assignments.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        assignments.map((a) => {
          const sub = getSubmission(a.id);
          const overdue = isOverdue(a.deadline);
          const canSub = canSubmit(a);
          const statusInfo = statusConfig[a.status] || statusConfig.PUBLISHED;

          return (
            <Card key={a.id} className={overdue && !sub ? "border-red-200" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                      {overdue && !sub && (
                        <span className="inline-flex items-center rounded-md bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 text-xs font-medium">
                          Overdue
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg">{a.title}</CardTitle>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {a.subjects?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due: {formatDateTime(a.deadline)}
                      </span>
                    </div>
                  </div>
                  {a.max_marks && (
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Max Marks</span>
                      <p className="text-lg font-bold">{a.max_marks}</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {a.description && (
                  <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{a.description}</p>
                )}

                <div className="border-t pt-4">
                  {sub ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-700">Submitted</span>
                        <span className="text-muted-foreground">
                          on {formatDateTime(sub.submitted_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <LinkIcon className="w-3 h-3 text-muted-foreground" />
                        <a
                          href={sub.submission_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          View Submission
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {sub.marks_obtained !== null && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-800">Grade</span>
                            <span className="text-lg font-bold text-green-700">
                              {sub.marks_obtained} / {a.max_marks || "—"}
                            </span>
                          </div>
                          {sub.feedback && (
                            <p className="text-sm text-green-700 mt-1">{sub.feedback}</p>
                          )}
                        </div>
                      )}
                      {canSub && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSubmitDialog(a);
                            setSubmissionUrl(sub.submission_url);
                          }}
                        >
                          Replace Submission
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Not submitted yet</p>
                      {canSub ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSubmitDialog(a);
                            setSubmissionUrl("");
                          }}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Submit
                        </Button>
                      ) : (
                        <span className="text-sm text-red-600">Submission closed</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Submit Assignment Dialog */}
      <Dialog open={!!submitDialog} onOpenChange={(open) => !open && setSubmitDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {submitDialog && getSubmission(submitDialog.id) ? "Replace Submission" : "Submit Assignment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {submitDialog && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">{submitDialog.title}</p>
                <p className="text-sm text-muted-foreground">{submitDialog.subjects?.name}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Submission URL</Label>
              <Input
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
              />
              <p className="text-xs text-muted-foreground">
                Paste the URL of your submission file (Google Drive, GitHub, etc.)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
