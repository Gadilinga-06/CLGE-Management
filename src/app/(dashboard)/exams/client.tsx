/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createExam, addExamSubject } from "./actions";
import { toast } from "sonner";
import { FileText, PlusCircle, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function ExamsClient({ exams, subjects, academicYears, semesters }: { exams: any[], subjects: any[], academicYears: any[], semesters: any[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [activeExamForSubject, setActiveExamForSubject] = useState<any>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const handleCreateExam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    const result = await createExam(formData);
    
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Exam created!");
      (e.target as HTMLFormElement).reset();
    }
    setIsCreating(false);
  };

  const handleAddSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingSubject(true);
    const formData = new FormData(e.currentTarget);
    formData.append("exam_id", activeExamForSubject.id);
    
    const result = await addExamSubject(formData);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Subject configuration added to exam.");
      setActiveExamForSubject(null);
    }
    setIsAddingSubject(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Create Exam Form */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Exam</CardTitle>
          </CardHeader>
          <form onSubmit={handleCreateExam}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Exam Name</Label>
                <Input name="name" placeholder="e.g. Midterm 1" required />
              </div>
              
              <div className="space-y-2">
                <Label>Type</Label>
                <Select name="type" required>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERNAL">Internal Exam</SelectItem>
                    <SelectItem value="PRACTICAL">Practical Exam</SelectItem>
                    <SelectItem value="MODEL">Model Exam</SelectItem>
                    <SelectItem value="SEMESTER">Semester Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select name="academic_year_id" required>
                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent>
                      {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.year_range}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select name="semester_id" required>
                    <SelectTrigger><SelectValue placeholder="Sem" /></SelectTrigger>
                    <SelectContent>
                      {semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.semester_number}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isCreating}>Create Exam</Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Exams List */}
      <div className="col-span-1 lg:col-span-2">
        <div className="grid gap-4 md:grid-cols-2">
          {exams.map(exam => (
            <Card key={exam.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{exam.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{exam.type}</Badge>
                      <Badge variant={exam.status === 'UPCOMING' ? 'secondary' : 'default'}>{exam.status}</Badge>
                    </div>
                  </div>
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-4">
                  Sem {exam.semesters?.semester_number} • {exam.academic_years?.year_range}
                </p>
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-sm font-semibold flex items-center justify-between">
                    Configured Subjects
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setActiveExamForSubject(exam)}>
                      <PlusCircle className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </h4>
                  {exam.exam_subjects && exam.exam_subjects.length > 0 ? (
                    <div className="space-y-1">
                      {exam.exam_subjects.map((es: any) => (
                        <div key={es.id} className="flex justify-between text-xs bg-muted/30 p-1.5 rounded">
                          <span>{es.subjects?.name}</span>
                          <span className="font-mono">Max: {es.max_marks}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No subjects configured yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {exams.length === 0 && (
             <div className="col-span-2 text-center p-12 text-muted-foreground border rounded-lg bg-muted/20">
               <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
               <p>No exams have been created yet.</p>
             </div>
          )}
        </div>
      </div>

      {/* Add Subject Config Modal */}
      <Dialog open={!!activeExamForSubject} onOpenChange={(open) => !open && setActiveExamForSubject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Subject for {activeExamForSubject?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubject}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select name="subject_id" required>
                  <SelectTrigger><SelectValue placeholder="Select subject..."/></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.subject_code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam Date</Label>
                <Input name="date" type="date" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input name="start_time" type="time" required />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input name="end_time" type="time" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Marks</Label>
                  <Input name="max_marks" type="number" step="0.01" required placeholder="100" />
                </div>
                <div className="space-y-2">
                  <Label>Min Pass Marks</Label>
                  <Input name="min_pass_marks" type="number" step="0.01" required placeholder="40" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setActiveExamForSubject(null)}>Cancel</Button>
              <Button type="submit" disabled={isAddingSubject}>Save Configuration</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
