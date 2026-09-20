/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  createCompany, updateCompany,
  createJobPost, updateJobPost, closeJobPost,
  updateApplicationPipeline,
} from "../placement/actions";
import {
  Plus, Building2, Briefcase, Users, CheckCircle,
  IndianRupee, TrendingUp, ExternalLink, Edit, XCircle,
} from "lucide-react";

const PIPELINE_STATUSES = ["APPLIED", "SHORTLISTED", "APTITUDE", "TECHNICAL", "INTERVIEW", "SELECTED", "REJECTED"];

const statusColors: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-800 border-blue-200",
  SHORTLISTED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APTITUDE: "bg-purple-100 text-purple-800 border-purple-200",
  TECHNICAL: "bg-indigo-100 text-indigo-800 border-indigo-200",
  INTERVIEW: "bg-orange-100 text-orange-800 border-orange-200",
  SELECTED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

const jobStatusColors: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800 border-green-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};

export function PlacementDashboardClient({
  companies, jobPosts, applications, stats,
}: {
  companies: any[];
  jobPosts: any[];
  applications: any[];
  stats: {
    totalCompanies: number;
    totalJobs: number;
    totalApplicants: number;
    selectedCount: number;
    avgPackage: number;
    highestPackage: number;
  };
}) {
  const [companyDialog, setCompanyDialog] = useState<any>(null);
  const [jobPostDialog, setJobPostDialog] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompanySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = companyDialog?.id
      ? await updateCompany(companyDialog.id, formData)
      : await createCompany(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(companyDialog?.id ? "Company updated" : "Company created");
      setCompanyDialog(null);
    }
    setIsSubmitting(false);
  };

  const handleJobPostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = jobPostDialog?.id
      ? await updateJobPost(jobPostDialog.id, formData)
      : await createJobPost(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(jobPostDialog?.id ? "Job post updated" : "Job post created");
      setJobPostDialog(null);
    }
    setIsSubmitting(false);
  };

  const handleCloseJob = async (id: string) => {
    const result = await closeJobPost(id);
    if (result?.error) toast.error(result.error);
    else toast.success("Job post closed");
  };

  const handlePipelineUpdate = async (appId: string, newStatus: string) => {
    const result = await updateApplicationPipeline(appId, newStatus);
    if (result?.error) toast.error(result.error);
    else toast.success(`Status updated to ${newStatus}`);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Companies</span>
              <Building2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Job Posts</span>
              <Briefcase className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Applicants</span>
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">{stats.totalApplicants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selected</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.selectedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Package</span>
              <IndianRupee className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-bold">₹{stats.avgPackage.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Highest Package</span>
              <TrendingUp className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold">₹{stats.highestPackage.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="companies">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="jobs">Job Posts</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>
        </div>

        {/* Companies Tab */}
        <TabsContent value="companies">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setCompanyDialog({})}>
              <Plus className="w-4 h-4 mr-2" /> Add Company
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm">{c.industry || "—"}</TableCell>
                      <TableCell className="text-sm">{c.location || "—"}</TableCell>
                      <TableCell className="text-sm">{c.contact_email || c.contact_person || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setCompanyDialog(c)}>
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {companies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No companies added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Posts Tab */}
        <TabsContent value="jobs">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setJobPostDialog({})}>
              <Plus className="w-4 h-4 mr-2" /> Add Job Post
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobPosts.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell className="font-medium">{j.title}</TableCell>
                      <TableCell className="text-sm">{j.companies?.name || "—"}</TableCell>
                      <TableCell className="text-sm">{j.package_amount ? `₹${j.package_amount.toLocaleString()}` : "—"}</TableCell>
                      <TableCell className="text-sm">{j.location || "—"}</TableCell>
                      <TableCell className="text-sm">{j.deadline ? new Date(j.deadline).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${jobStatusColors[j.status] || ""}`}>
                          {j.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="outline" onClick={() => setJobPostDialog(j)}>
                            <Edit className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          {j.status === "OPEN" && (
                            <Button size="sm" variant="destructive" onClick={() => handleCloseJob(j.id)}>
                              <XCircle className="w-3 h-3 mr-1" /> Close
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {jobPosts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No job posts created yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Job Post</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm">
                        {a.students?.profiles?.first_name} {a.students?.profiles?.last_name}
                        <span className="block text-xs text-muted-foreground">{a.students?.admission_number}</span>
                      </TableCell>
                      <TableCell className="text-sm">{a.job_posts?.title} — {a.job_posts?.companies?.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColors[a.status] || ""}`}>
                          {a.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(a.applied_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={a.status}
                          onValueChange={(val: string | null) => val && handlePipelineUpdate(a.id, val)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PIPELINE_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {applications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No applications yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Company Dialog */}
      <Dialog open={!!companyDialog} onOpenChange={(open) => !open && setCompanyDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{companyDialog?.id ? "Edit Company" : "Add Company"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCompanySubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input name="name" required defaultValue={companyDialog?.name || ""} placeholder="Company name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input name="industry" defaultValue={companyDialog?.industry || ""} placeholder="e.g. IT, Finance" />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input name="location" defaultValue={companyDialog?.location || ""} placeholder="City, State" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input name="contact_person" defaultValue={companyDialog?.contact_person || ""} placeholder="Contact name" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input name="contact_email" type="email" defaultValue={companyDialog?.contact_email || ""} placeholder="email@company.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input name="website" defaultValue={companyDialog?.website || ""} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input name="logo_url" defaultValue={companyDialog?.logo_url || ""} placeholder="Logo image URL" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" defaultValue={companyDialog?.description || ""} placeholder="About the company..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCompanyDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Job Post Dialog */}
      <Dialog open={!!jobPostDialog} onOpenChange={(open) => !open && setJobPostDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{jobPostDialog?.id ? "Edit Job Post" : "Add Job Post"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleJobPostSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Company *</Label>
                <Select name="company_id" defaultValue={jobPostDialog?.company_id || ""}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input name="title" required defaultValue={jobPostDialog?.title || ""} placeholder="Job title" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" defaultValue={jobPostDialog?.description || ""} placeholder="Job description..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Requirements</Label>
                <Textarea name="requirements" defaultValue={jobPostDialog?.requirements || ""} placeholder="Job requirements..." rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Eligibility</Label>
                  <Input name="eligibility" defaultValue={jobPostDialog?.eligibility || ""} placeholder="e.g. B.Tech, CGPA >= 7" />
                </div>
                <div className="space-y-2">
                  <Label>Skills</Label>
                  <Input name="skills" defaultValue={jobPostDialog?.skills || ""} placeholder="e.g. React, Python" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Package (₹)</Label>
                  <Input name="package_amount" type="number" defaultValue={jobPostDialog?.package_amount || ""} placeholder="e.g. 500000" />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input name="location" defaultValue={jobPostDialog?.location || ""} placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label>Max Applicants</Label>
                  <Input name="max_applicants" type="number" defaultValue={jobPostDialog?.max_applicants || ""} placeholder="Unlimited" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input name="deadline" type="date" defaultValue={jobPostDialog?.deadline?.split("T")[0] || ""} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setJobPostDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
