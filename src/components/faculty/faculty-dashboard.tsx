/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Users, ClipboardList, Bell, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "@/components/ui/charts";

interface FacultyDashboardProps {
  faculty: any;
  serverData?: {
    todaysClasses: any[];
    pendingGrades: number;
    unreadNotices: number;
    attendanceBySubject: { name: string; rate: number }[];
  };
}

export function FacultyDashboard({ faculty, serverData }: FacultyDashboardProps) {
  const todaysClasses = serverData?.todaysClasses || [];
  const pendingGrades = serverData?.pendingGrades ?? 0;
  const unreadNotices = serverData?.unreadNotices ?? 0;
  const attendanceBySubject = serverData?.attendanceBySubject || [];

  const totalAssignments = faculty?.faculty_assignments?.length || 0;
  const uniqueSections = new Set(
    faculty?.faculty_assignments?.map((a: any) => a.section_id)
  ).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={faculty?.profiles?.avatar_url || ""} />
          <AvatarFallback className="text-xl">{faculty?.profiles?.first_name?.charAt(0)}{faculty?.profiles?.last_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome, {faculty?.profiles?.first_name}!</h2>
          <p className="text-muted-foreground">
            {faculty?.designation} • {faculty?.departments?.name}
          </p>
        </div>
      </div>
      
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Subjects Assigned</CardTitle>
            <BookOpen className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
             <div className="text-lg sm:text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground mt-1">Total active subjects</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Sections Taught</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{uniqueSections}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique student batches</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/assignments"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Grades</CardTitle>
            <ClipboardList className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{pendingGrades}</div>
            <p className="text-xs text-muted-foreground mt-1">Submissions to grade</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/notifications"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Notifications</CardTitle>
            <Bell className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{unreadNotices}</div>
            <p className="text-xs text-muted-foreground mt-1">Unread notifications</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>My Workload (Assignments)</CardTitle>
          </CardHeader>
          <CardContent>
            {totalAssignments === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/10 rounded-md border-dashed border">
                No subjects assigned yet.
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {faculty.faculty_assignments.map((assign: any) => (
                  <div key={assign.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-md gap-2">
                    <div>
                      <h4 className="font-semibold text-sm sm:text-lg">{assign.subjects?.name} <Badge variant="outline">{assign.subjects?.subject_code}</Badge></h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Section {assign.sections?.name} • Sem {assign.semesters?.semester_number}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="self-start sm:self-auto">Take Attendance</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {todaysClasses.length === 0 ? (
               <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/10 rounded-md border-dashed border">
                 No classes scheduled today
               </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {todaysClasses.map(slot => (
                  <div key={slot.id} className="flex flex-col p-3 border rounded-md border-l-4 border-l-primary">
                    <span className="font-semibold text-primary text-sm">{slot.start_time} - {slot.end_time}</span>
                    <span className="font-medium text-sm">{slot.subjects?.name}</span>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center"><Users className="w-3 h-3 mr-1"/> Sec {slot.sections?.name}</span>
                      <span className="flex items-center"><MapPin className="w-3 h-3 mr-1"/> Room {slot.rooms?.room_number}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance by Subject Chart */}
      {attendanceBySubject.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Attendance by Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceBySubject}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="rate" name="Attendance %" radius={[4, 4, 0, 0]}>
                    {attendanceBySubject.map((entry, i) => (
                      <Cell key={i} fill={entry.rate >= 75 ? "#10b981" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
