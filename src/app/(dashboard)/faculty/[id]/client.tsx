/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { updateFaculty, assignFacultyToAcademic, removeFacultyAssignment } from "../actions";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Trash2, Upload, FileIcon, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function FacultyProfileClient({ faculty, documents, canEdit, lookups }: { faculty: any, documents: any[], canEdit: boolean, lookups: any }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [docs, setDocs] = useState(documents);
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;
    setIsUpdating(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateFaculty(faculty.id, formData);
    if (result?.error) toast.error(result.error);
    else toast.success("Profile updated successfully");
    setIsUpdating(false);
  };

  const handleAssign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;
    setIsUpdating(true);
    const formData = new FormData(e.currentTarget);
    const result = await assignFacultyToAcademic(faculty.id, formData);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Assignment added successfully");
      (e.target as HTMLFormElement).reset();
    }
    setIsUpdating(false);
  };

  const handleRemoveAssign = async (assignmentId: string) => {
    if (!canEdit) return;
    if (!confirm("Are you sure you want to remove this assignment?")) return;
    const result = await removeFacultyAssignment(assignmentId, faculty.id);
    if (result?.error) toast.error(result.error);
    else toast.success("Assignment removed");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    setIsUploading(true);
    // eslint-disable-next-line react-hooks/purity
    const randomId = Math.floor(Math.random() * 1000000);
    const filePath = `documents/${faculty.id}/${randomId}_${file.name}`;
    try {
      const { error: uploadError } = await supabase.storage.from('faculty-assets').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data, error: dbError } = await supabase.from('faculty_documents').insert({
        faculty_id: faculty.id,
        college_id: faculty.college_id,
        document_type: docType,
        title: file.name,
        file_path: filePath
      }).select().single();
      if (dbError) throw dbError;
      setDocs([data, ...docs]);
      toast.success("Document uploaded successfully");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadDoc = async (path: string, title: string) => {
    try {
      const { data, error } = await supabase.storage.from('faculty-assets').createSignedUrl(path, 60);
      if (error) throw error;
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      toast.error("Failed to download: " + error.message);
    }
  };

  const deleteDoc = async (id: string, path: string) => {
    try {
      await supabase.storage.from('faculty-assets').remove([path]);
      await supabase.from('faculty_documents').delete().eq('id', id);
      setDocs(docs.filter(d => d.id !== id));
      toast.success("Document deleted");
    } catch (error: any) {
      toast.error("Delete failed: " + error.message);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={faculty.profiles?.avatar_url || ""} />
              <AvatarFallback className="text-2xl">{faculty.profiles?.first_name?.charAt(0)}{faculty.profiles?.last_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold">{faculty.profiles?.first_name} {faculty.profiles?.last_name}</h3>
            <p className="text-sm text-muted-foreground">{faculty.designation}</p>
            <p className="text-xs text-muted-foreground mt-1">ID: {faculty.employee_id}</p>
            <Badge className="mt-2" variant={faculty.status === "ACTIVE" ? "default" : "secondary"}>
              {faculty.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0">
            <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6">General Info</TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6">Assignments</TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="pt-4">
            <form onSubmit={handleUpdate}>
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department_id">Department</Label>
                      <Select name="department_id" defaultValue={faculty.department_id || ""} disabled={!canEdit || isUpdating}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {lookups.departments?.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation</Label>
                      <Input name="designation" defaultValue={faculty.designation || ""} disabled={!canEdit || isUpdating} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="qualification">Qualification</Label>
                      <Input name="qualification" defaultValue={faculty.qualification || ""} disabled={!canEdit || isUpdating} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="joining_date">Joining Date</Label>
                      <Input type="date" name="joining_date" defaultValue={faculty.joining_date || ""} disabled={!canEdit || isUpdating} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={faculty.status || "ACTIVE"} disabled={!canEdit || isUpdating}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                        <SelectItem value="RESIGNED">Resigned</SelectItem>
                        <SelectItem value="TERMINATED">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                {canEdit && (
                  <CardFooter className="justify-end">
                    <Button type="submit" disabled={isUpdating}>Save Changes</Button>
                  </CardFooter>
                )}
              </Card>
            </form>
          </TabsContent>

          <TabsContent value="assignments" className="pt-4 space-y-4">
            {canEdit && (
              <Card>
                <CardHeader>
                  <CardTitle>Assign New Subject</CardTitle>
                </CardHeader>
                <form onSubmit={handleAssign}>
                  <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select name="subject_id" required>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {lookups.subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.subject_code})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select name="section_id" required>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {lookups.sections?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Semester</Label>
                      <Select name="semester_id" required>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {lookups.semesters?.map((s: any) => <SelectItem key={s.id} value={s.id}>Sem {s.semester_number}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Academic Year</Label>
                      <Select name="academic_year_id" required>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {lookups.academicYears?.map((ay: any) => <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button type="submit" disabled={isUpdating}><Plus className="w-4 h-4 mr-2"/> Add Assignment</Button>
                  </CardFooter>
                </form>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Current Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {faculty.faculty_assignments?.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">No subjects assigned yet.</div>
                ) : (
                  <div className="space-y-2">
                    {faculty.faculty_assignments?.map((assign: any) => (
                      <div key={assign.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <p className="font-medium">{assign.subjects?.name} ({assign.subjects?.subject_code})</p>
                          <p className="text-sm text-muted-foreground">
                            Section {assign.sections?.name} • Sem {assign.semesters?.semester_number} • {assign.academic_years?.name}
                          </p>
                        </div>
                        {canEdit && (
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveAssign(assign.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {["ID_PROOF", "DEGREE", "CONTRACT"].map((docType) => {
                const existingDoc = docs.find(d => d.document_type === docType);
                return (
                  <Card key={docType} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        {docType.replace('_', ' ')}
                        {existingDoc ? <Badge variant="default" className="bg-green-500">Uploaded</Badge> : <Badge variant="outline">Missing</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end">
                      {existingDoc ? (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md mt-4">
                          <div className="flex items-center truncate mr-2">
                            <FileText className="h-4 w-4 mr-2 text-primary shrink-0" />
                            <span className="text-xs truncate" title={existingDoc.title}>{existingDoc.title}</span>
                          </div>
                          <div className="flex shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadDoc(existingDoc.file_path, existingDoc.title)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => deleteDoc(existingDoc.id, existingDoc.file_path)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        canEdit && (
                          <div className="mt-4 relative border-2 border-dashed rounded-md p-4 text-center hover:bg-muted/50 transition-colors">
                            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground block">Upload Document</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={isUploading}
                              onChange={(e) => handleFileUpload(e, docType)}
                            />
                          </div>
                        )
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            {canEdit && (
               <div className="flex justify-end mt-4">
                  <div className="relative inline-block">
                    <Button variant="outline" disabled={isUploading}>
                      <Upload className="h-4 w-4 mr-2" /> Upload Other Document
                    </Button>
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                      onChange={(e) => handleFileUpload(e, "OTHER")}
                    />
                  </div>
               </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
