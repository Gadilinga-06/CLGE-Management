/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createAttendanceSession, saveBulkAttendance } from "./actions";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { QrCode, Save, Clock, ArrowRight } from "lucide-react";

export function AttendanceClient({ assignments, recentSessions, userId }: { assignments: any[], recentSessions: any[], userId: string }) {
  const [isCreating, setIsCreating] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const handleCreateSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    const result = await createAttendanceSession(formData);
    
    if (result?.error) {
      toast.error(result.error);
      setIsCreating(false);
      return;
    }

    toast.success("Session created successfully");
    
    // Load the session and students
    await loadSessionAndStudents(result.sessionId, formData.get("assignment_id") as string);
    setIsCreating(false);
  };

  const loadSessionAndStudents = async (sessionId: string, assignmentId: string) => {
    // 1. Get the assignment to know the section
    const assign = assignments.find(a => a.id === assignmentId);
    if (!assign) return;

    // 2. Fetch all students in that section
    const { data: sectionStudents } = await supabase
      .from("students")
      .select("id, profiles(first_name, last_name, avatar_url), admission_number")
      .eq("section_id", assign.sections.id)
      .eq("status", "ACTIVE")
      .order("admission_number");
    
    setStudents(sectionStudents || []);

    // 3. Fetch existing attendance records for this session if any
    const { data: records } = await supabase
      .from("attendance_records")
      .select("student_id, status")
      .eq("session_id", sessionId);

    // Initialize attendance state
    const newState: Record<string, string> = {};
    if (sectionStudents) {
      sectionStudents.forEach(s => {
        const existing = records?.find(r => r.student_id === s.id);
        newState[s.id] = existing ? existing.status : 'PRESENT'; // Default present
      });
    }
    setAttendanceData(newState);
    
    // Set active session metadata
    setActiveSession({
      id: sessionId,
      subject: assign.subjects.name,
      section: assign.sections.name
    });
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: string) => {
    const newState: Record<string, string> = {};
    students.forEach(s => newState[s.id] = status);
    setAttendanceData(newState);
  };

  const handleSaveBulk = async () => {
    if (!activeSession) return;
    setIsSaving(true);
    const payload = Object.entries(attendanceData).map(([student_id, status]) => ({
      student_id, status
    }));

    const result = await saveBulkAttendance(activeSession.id, payload);
    if (result?.error) toast.error(result.error);
    else toast.success("Attendance saved successfully");
    setIsSaving(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Create/Select Session */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Start New Session</CardTitle>
          </CardHeader>
          <form onSubmit={handleCreateSession}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Class / Subject</Label>
                <Select name="assignment_id" required disabled={isCreating}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {assignments.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.subjects?.name} - {a.sections?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} disabled={isCreating}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" name="start_time" required defaultValue="09:00" disabled={isCreating}/>
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" name="end_time" required defaultValue="10:00" disabled={isCreating}/>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isCreating}>Start Session</Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
             {recentSessions.length === 0 ? (
               <p className="text-sm text-muted-foreground text-center">No recent sessions found.</p>
             ) : (
               <div className="space-y-2">
                 {recentSessions.map(rs => (
                   <div key={rs.id} className="flex flex-col p-3 border rounded-md hover:bg-muted/50 cursor-pointer">
                     <span className="font-semibold">{rs.subjects?.name}</span>
                     <span className="text-xs text-muted-foreground">{rs.sections?.name} • {rs.date}</span>
                     <span className="text-xs text-muted-foreground">{rs.start_time} - {rs.end_time}</span>
                   </div>
                 ))}
               </div>
             )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Attendance Grid */}
      <div className="col-span-1 lg:col-span-2">
        {!activeSession ? (
          <Card className="h-full flex items-center justify-center min-h-[400px]">
            <div className="text-center text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start a new session or select a recent one to mark attendance.</p>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>{activeSession.subject}</CardTitle>
                <p className="text-sm text-muted-foreground">Section {activeSession.section} • {students.length} Students</p>
              </div>
              <Link href={`/attendance/qr/${activeSession.id}`} target="_blank">
                <Button variant="outline"><QrCode className="w-4 h-4 mr-2"/> Launch QR Scanner</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end gap-2 mb-4">
                <Button variant="secondary" size="sm" onClick={() => markAll('PRESENT')}>Mark All Present</Button>
                <Button variant="secondary" size="sm" onClick={() => markAll('ABSENT')}>Mark All Absent</Button>
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-center">Late</TableHead>
                      <TableHead className="text-center">Excused</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
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
                        <TableCell colSpan={4}>
                          <RadioGroup 
                            className="flex justify-between max-w-[300px] mx-auto" 
                            value={attendanceData[student.id]} 
                            onValueChange={(val) => handleStatusChange(student.id, val)}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="PRESENT" id={`p_${student.id}`} />
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="ABSENT" id={`a_${student.id}`} />
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="LATE" id={`l_${student.id}`} />
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="EXCUSED" id={`e_${student.id}`} />
                            </div>
                          </RadioGroup>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSaveBulk} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Attendance"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
