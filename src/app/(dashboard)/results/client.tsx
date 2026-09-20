/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { publishMarks } from "../exams/actions";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Printer, FileText, Award } from "lucide-react";

// --- ADMIN CLIENT ---

export function ResultsAdminClient({ summaries }: { summaries: any[] }) {
  const [isPublishing, setIsPublishing] = useState<string | null>(null);

  const handlePublish = async (examId: string, subjectId: string, uniqueId: string) => {
    if (!confirm("Are you sure you want to PUBLISH these marks? This action makes the marks visible to students and locks them from further editing.")) return;
    
    setIsPublishing(uniqueId);
    const result = await publishMarks(examId, subjectId);
    if (result?.error) toast.error(result.error);
    else toast.success("Results published successfully!");
    setIsPublishing(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Mark States</CardTitle>
      </CardHeader>
      <CardContent>
        {summaries.length === 0 ? (
           <p className="text-sm text-muted-foreground">No marks have been submitted for review yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Total Entries</TableHead>
                <TableHead className="text-center">Pending Publication</TableHead>
                <TableHead className="text-center">Published</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.exams?.name}</TableCell>
                  <TableCell>{s.subjects?.name} ({s.subjects?.subject_code})</TableCell>
                  <TableCell className="text-center">{s.total}</TableCell>
                  <TableCell className="text-center">
                    {s.submitted > 0 ? <Badge variant="secondary">{s.submitted}</Badge> : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.published > 0 ? <Badge className="bg-green-500">{s.published}</Badge> : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.readyToPublish ? (
                      <Button 
                        size="sm" 
                        onClick={() => handlePublish(s.exam_id, s.subject_id, s.id)}
                        disabled={isPublishing === s.id}
                      >
                        Publish Results
                      </Button>
                    ) : s.published > 0 ? (
                      <span className="text-sm text-green-600 font-medium flex items-center justify-end"><CheckCircle className="w-4 h-4 mr-1"/> Published</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Waiting for submission</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// --- STUDENT CLIENT ---

export function ResultsStudentClient({ marks, gradingRules, profile }: { marks: any[], gradingRules: any[], profile: any }) {
  
  const calculateGrade = (obtained: number, max: number) => {
    const percentage = (obtained / max) * 100;
    const rule = gradingRules.find(r => percentage >= r.min_percentage && percentage <= r.max_percentage);
    return rule ? { grade: rule.grade, point: rule.grade_point } : { grade: "F", point: 0 };
  };

  // Group marks by Semester
  const groupedBySemester = useMemo(() => {
    const groups: Record<string, { marks: any[], totalCredits: number, earnedPoints: number, sgpa: number }> = {};
    
    marks.forEach(m => {
      // Safely check if exam_subjects exists and has max_marks, otherwise skip
      if (!m.exam_subjects || typeof m.exam_subjects.max_marks !== 'number') return;
      
      const sem = m.exams?.semesters?.semester_number || "Unknown";
      if (!groups[sem]) groups[sem] = { marks: [], totalCredits: 0, earnedPoints: 0, sgpa: 0 };
      
      // Assume default credit is 3 if not specified
      const credits = m.exam_subjects?.subjects?.credits || 3;
      const { point } = calculateGrade(m.marks_obtained, m.exam_subjects.max_marks);
      
      groups[sem].marks.push(m);
      groups[sem].totalCredits += credits;
      groups[sem].earnedPoints += (credits * point);
    });

    Object.keys(groups).forEach(sem => {
      groups[sem].sgpa = groups[sem].totalCredits > 0 
        ? (groups[sem].earnedPoints / groups[sem].totalCredits) 
        : 0;
    });

    return groups;
  }, [marks, gradingRules]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-8">
      <div className="flex justify-end print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Print Transcript
        </Button>
      </div>

      {/* Transcript Header for Print */}
      <div className="hidden print:block text-center border-b-2 border-black pb-6 mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-widest">Official Transcript</h1>
        <h2 className="text-xl font-semibold mt-2">{profile?.first_name} {profile?.last_name}</h2>
        <p className="text-gray-600 mt-1">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {Object.keys(groupedBySemester).length === 0 ? (
        <Card className="print:hidden">
          <CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No published results available yet.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedBySemester).sort((a,b) => Number(a[0]) - Number(b[0])).map(([sem, data]) => (
          <Card key={sem} className="print:shadow-none print:border-black print:mb-8">
            <CardHeader className="bg-muted/30 print:bg-transparent print:border-b print:border-black pb-4">
              <div className="flex justify-between items-center">
                <CardTitle>Semester {sem}</CardTitle>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold print:text-black">SGPA</div>
                  <div className="text-3xl font-bold text-primary print:text-black flex items-center">
                    <Award className="w-6 h-6 mr-2 print:hidden" /> {data.sgpa.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="print:border-b-2 print:border-black">
                    <TableHead>Course Code</TableHead>
                    <TableHead>Subject Name</TableHead>
                    <TableHead className="text-center">Credits</TableHead>
                    <TableHead className="text-center">Marks</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.marks.map((m: any) => {
                    const credits = m.exam_subjects?.subjects?.credits || 3;
                    const { grade } = calculateGrade(m.marks_obtained, m.exam_subjects?.max_marks);
                    const isFail = grade === 'F';
                    
                    return (
                      <TableRow key={m.id} className="print:border-b print:border-gray-300">
                        <TableCell className="font-medium">{m.exam_subjects?.subjects?.subject_code}</TableCell>
                        <TableCell>{m.exam_subjects?.subjects?.name}</TableCell>
                        <TableCell className="text-center">{credits}</TableCell>
                        <TableCell className="text-center">{m.marks_obtained} / {m.exam_subjects?.max_marks}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${isFail ? 'text-red-500' : 'text-green-600'} print:text-black`}>
                            {grade}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
