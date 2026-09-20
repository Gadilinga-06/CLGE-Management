/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveStudentMark } from "../exams/actions";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

export function MarksClient({ examSubjects, sectionsMap, userId }: { examSubjects: any[], sectionsMap: Record<string, string>, userId: string }) {
  const [selectedExamSubjectId, setSelectedExamSubjectId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [marksData, setMarksData] = useState<Record<string, { marks: string, status: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const activeES = examSubjects.find(es => es.id === selectedExamSubjectId);

  const loadStudents = async (esId: string) => {
    setSelectedExamSubjectId(esId);
    const es = examSubjects.find(e => e.id === esId);
    if (!es) return;

    // Determine section (either from faculty mapping or we need a selector for admins - 
    // for simplicity, if admin, we pull all students taking this subject via course/semester mapping, 
    // but in this CMS model, students belong to a section. If faculty, we know the exact section).
    const sectionId = sectionsMap[es.subject_id];
    
    // For admins without direct assignment, we'd theoretically need a section dropdown. 
    // Let's assume for this specific flow they fetch all students in the subject's semester.
    
    let query = supabase
      .from("students")
      .select("id, admission_number, profiles(first_name, last_name, avatar_url)")
      .eq("status", "ACTIVE");
      
    if (sectionId) {
      query = query.eq("section_id", sectionId);
    }
    
    const { data: studentList } = await query;
    setStudents(studentList || []);

    // Fetch existing marks
    const { data: existingMarks } = await supabase
      .from("exam_marks")
      .select("student_id, marks_obtained, status")
      .eq("exam_id", es.exam_id)
      .eq("subject_id", es.subject_id);

    const newState: Record<string, { marks: string, status: string }> = {};
    if (studentList) {
      studentList.forEach(s => {
        const existing = existingMarks?.find(m => m.student_id === s.id);
        if (existing) {
          newState[s.id] = { marks: existing.marks_obtained.toString(), status: existing.status };
        } else {
          newState[s.id] = { marks: "", status: "DRAFT" };
        }
      });
    }
    setMarksData(newState);
  };

  const handleMarksChange = (studentId: string, val: string) => {
    // Only allow update if not published
    if (marksData[studentId]?.status === "PUBLISHED") return;
    setMarksData(prev => ({ ...prev, [studentId]: { ...prev[studentId], marks: val } }));
  };

  const handleSave = async (submitForApproval: boolean) => {
    if (!activeES) return;
    setIsSaving(true);
    let errorCount = 0;

    for (const student of students) {
      const data = marksData[student.id];
      if (!data.marks || data.status === "PUBLISHED") continue;

      const marksNum = parseFloat(data.marks);
      if (marksNum > activeES.max_marks || marksNum < 0) {
        toast.error(`Invalid marks for ${student.profiles?.first_name}. Max is ${activeES.max_marks}.`);
        errorCount++;
        continue;
      }

      const result = await saveStudentMark({
        exam_id: activeES.exam_id,
        subject_id: activeES.subject_id,
        student_id: student.id,
        marks_obtained: marksNum,
        status: submitForApproval ? 'SUBMITTED' : 'DRAFT'
      });

      if (result?.error) {
        toast.error(result.error);
        errorCount++;
      }
    }

    if (errorCount === 0) {
      toast.success(submitForApproval ? "Marks submitted for approval!" : "Draft marks saved successfully.");
      // update local state
      const newState = { ...marksData };
      Object.keys(newState).forEach(k => {
        if (newState[k].marks && newState[k].status !== 'PUBLISHED') {
           newState[k].status = submitForApproval ? 'SUBMITTED' : 'DRAFT';
        }
      });
      setMarksData(newState);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Exam Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-2">
            <Label>Exam - Subject</Label>
            <Select value={selectedExamSubjectId} onValueChange={(val) => loadStudents(val || "")}>
              <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
              <SelectContent>
                {examSubjects.map(es => (
                  <SelectItem key={es.id} value={es.id}>
                    {es.exams?.name} - {es.subjects?.name} (Max: {es.max_marks})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {activeES && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>{activeES.exams?.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{activeES.subjects?.name} • Max Marks: {activeES.max_marks}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>Save Draft</Button>
              <Button onClick={() => handleSave(true)} disabled={isSaving}>Submit for Approval</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Marks Obtained</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const data = marksData[student.id];
                    const isLocked = data?.status === "PUBLISHED" || data?.status === "SUBMITTED" || data?.status === "APPROVED";
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.profiles?.avatar_url || ""} />
                              <AvatarFallback>{student.profiles?.first_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{student.profiles?.first_name} {student.profiles?.last_name}</span>
                              <span className="text-xs text-muted-foreground">{student.admission_number}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            step="0.01" 
                            max={activeES.max_marks}
                            min={0}
                            className="max-w-[150px]"
                            value={data?.marks || ""}
                            onChange={(e) => handleMarksChange(student.id, e.target.value)}
                            disabled={isLocked}
                            placeholder={`Max ${activeES.max_marks}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            data?.status === 'PUBLISHED' ? 'default' :
                            data?.status === 'APPROVED' ? 'default' :
                            data?.status === 'SUBMITTED' ? 'secondary' : 'outline'
                          } className={data?.status === 'PUBLISHED' ? 'bg-green-500' : ''}>
                            {data?.status || 'DRAFT'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
