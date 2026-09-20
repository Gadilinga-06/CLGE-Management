/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { updateStudent } from "../actions";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Trash2, Upload, FileIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function StudentProfileClient({ student, documents, canEdit, lookups, qrToken }: { student: any, documents: any[], canEdit: boolean, lookups: any, qrToken: string }) {
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
    const result = await updateStudent(student.id, formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Profile updated successfully");
    }
    setIsUpdating(false);
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
    const filePath = `documents/${student.id}/${randomId}_${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('student-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error: dbError } = await supabase
        .from('student_documents')
        .insert({
          student_id: student.id,
          college_id: student.college_id,
          document_type: docType,
          title: file.name,
          file_path: filePath
        })
        .select()
        .single();

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
      const { data, error } = await supabase.storage.from('student-assets').createSignedUrl(path, 60);
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
      await supabase.storage.from('student-assets').remove([path]);
      await supabase.from('student_documents').delete().eq('id', id);
      setDocs(docs.filter(d => d.id !== id));
      toast.success("Document deleted");
    } catch (error: any) {
      toast.error("Delete failed: " + error.message);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar Profile Info & QR Code */}
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={student.profiles?.avatar_url || ""} />
              <AvatarFallback className="text-2xl">{student.profiles?.first_name?.charAt(0)}{student.profiles?.last_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold">{student.profiles?.first_name} {student.profiles?.last_name}</h3>
            <p className="text-sm text-muted-foreground">{student.admission_number}</p>
            <Badge className="mt-2" variant={student.status === "ACTIVE" ? "default" : "destructive"}>
              {student.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Digital ID (QR)</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="p-4 bg-white rounded-lg border">
              <QRCodeSVG 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/student/${qrToken}`} 
                size={140}
                level="M"
                includeMargin={false}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="md:col-span-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0">
            <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6">General Info</TabsTrigger>
            <TabsTrigger value="academic" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6">Academic Details</TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="pt-4">
            <form onSubmit={handleUpdate}>
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update personal and contact details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input value={student.profiles?.first_name || ""} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input value={student.profiles?.last_name || ""} disabled />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={student.profiles?.email || ""} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={student.profiles?.phone || ""} disabled />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input id="dob" name="dob" type="date" defaultValue={student.dob || ""} disabled={!canEdit || isUpdating} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select name="gender" defaultValue={student.gender || ""} disabled={!canEdit || isUpdating}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" defaultValue={student.address || ""} disabled={!canEdit || isUpdating} />
                  </div>
                </CardContent>
                {canEdit && (
                  <CardFooter className="justify-end">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </form>
          </TabsContent>

          <TabsContent value="academic" className="pt-4">
            <form onSubmit={handleUpdate}>
              <Card>
                <CardHeader>
                  <CardTitle>Academic Enrollment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department_id">Department</Label>
                      <Select name="department_id" defaultValue={student.department_id || ""} disabled={!canEdit || isUpdating}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {lookups.departments?.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="course_id">Program (Course)</Label>
                      <Select name="course_id" defaultValue={student.course_id || ""} disabled={!canEdit || isUpdating}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {lookups.courses?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="semester_id">Semester</Label>
                      <Select name="semester_id" defaultValue={student.semester_id || ""} disabled={!canEdit || isUpdating}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {lookups.semesters?.map((s: any) => <SelectItem key={s.id} value={s.id}>Sem {s.semester_number} {s.name ? `(${s.name})` : ''}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section_id">Section</Label>
                      <Select name="section_id" defaultValue={student.section_id || ""} disabled={!canEdit || isUpdating}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {lookups.sections?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="academic_year_id">Academic Year</Label>
                      <Select name="academic_year_id" defaultValue={student.academic_year_id || ""} disabled={!canEdit || isUpdating}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {lookups.academicYears?.map((ay: any) => <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue={student.status || "ACTIVE"} disabled={!canEdit || isUpdating}>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                          <SelectItem value="GRADUATED">Graduated</SelectItem>
                          <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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

          <TabsContent value="documents" className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {["ID_PROOF", "ADMISSION_DOC", "CERTIFICATE"].map((docType) => {
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
            
            {docs.filter(d => !["ID_PROOF", "ADMISSION_DOC", "CERTIFICATE"].includes(d.document_type)).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Other Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {docs.filter(d => !["ID_PROOF", "ADMISSION_DOC", "CERTIFICATE"].includes(d.document_type)).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center">
                          <FileIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex">
                          <Button variant="ghost" size="icon" onClick={() => downloadDoc(doc.file_path, doc.title)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => deleteDoc(doc.id, doc.file_path)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
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
