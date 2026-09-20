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
import { toast } from "sonner";
import { applyToJob } from "../placement/actions";
import { Briefcase, MapPin, Calendar, IndianRupee, ExternalLink, CheckCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-800 border-blue-200",
  SHORTLISTED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APTITUDE: "bg-purple-100 text-purple-800 border-purple-200",
  TECHNICAL: "bg-indigo-100 text-indigo-800 border-indigo-200",
  INTERVIEW: "bg-orange-100 text-orange-800 border-orange-200",
  SELECTED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

export function MyJobsClient({
  jobPosts, myApplications, studentId,
}: {
  jobPosts: any[];
  myApplications: any[];
  studentId: string;
}) {
  const [applyDialog, setApplyDialog] = useState<any>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appliedJobIds = new Set(myApplications.map((a) => a.job_post_id));

  const getApplicationStatus = (jobPostId: string) => {
    return myApplications.find((a) => a.job_post_id === jobPostId);
  };

  const handleApply = async () => {
    if (!applyDialog) return;
    setIsSubmitting(true);
    const result = await applyToJob(applyDialog.id, studentId, resumeUrl);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Application submitted successfully!");
      setApplyDialog(null);
      setResumeUrl("");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      {/* Available Jobs */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Opportunities</h3>
        {jobPosts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">No open job posts available at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobPosts.map((job) => {
              const applied = appliedJobIds.has(job.id);
              const appData = getApplicationStatus(job.id);
              return (
                <Card key={job.id} className="flex flex-col">
                  <CardContent className="pt-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-base">{job.title}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          {job.companies?.name}
                          {job.companies?.industry && (
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded ml-1">{job.companies.industry}</span>
                          )}
                        </p>
                      </div>
                      {applied && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" /> Applied
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground flex-1">
                      {job.description && (
                        <p className="line-clamp-2">{job.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {job.package_amount && (
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" /> ₹{job.package_amount.toLocaleString()}
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </span>
                        )}
                        {job.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(job.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {job.skills && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.skills.split(",").map((s: string, i: number) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t flex items-center justify-between">
                      {applied && appData ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Status:</span>
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColors[appData.status] || ""}`}>
                            {appData.status}
                          </span>
                        </div>
                      ) : (
                        <span />
                      )}
                      {applied ? (
                        <span className="text-xs text-muted-foreground">
                          Applied {new Date(appData?.applied_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <Button size="sm" onClick={() => { setApplyDialog(job); setResumeUrl(""); }}>
                          Apply Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* My Applications */}
      <div>
        <h3 className="text-lg font-semibold mb-4">My Applications</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myApplications.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.job_posts?.title}</TableCell>
                    <TableCell className="text-sm">{a.job_posts?.companies?.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColors[a.status] || ""}`}>
                        {a.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(a.applied_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {myApplications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      You haven&apos;t applied to any jobs yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Apply Dialog */}
      <Dialog open={!!applyDialog} onOpenChange={(open) => !open && setApplyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {applyDialog?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {applyDialog?.companies?.name && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">{applyDialog.companies.name}</p>
                {applyDialog.package_amount && (
                  <p className="text-sm text-muted-foreground">Package: ₹{applyDialog.package_amount.toLocaleString()}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>Resume URL (optional)</Label>
              <Input
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
              />
              <p className="text-xs text-muted-foreground">Paste a link to your resume (Google Drive, LinkedIn, etc.)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialog(null)}>Cancel</Button>
            <Button onClick={handleApply} disabled={isSubmitting}>
              {isSubmitting ? "Applying..." : "Confirm Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
