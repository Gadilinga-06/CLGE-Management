/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Calendar, ClipboardList, FileText, Banknote, Bell } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
} from "@/components/ui/charts";

interface StudentDashboardProps {
  student: any;
  serverData?: {
    attendancePct: number;
    outstandingFees: number;
    publishedResultsCount: number;
    pendingAssignments: number;
    unreadNotices: number;
    classesToday: number;
    attendanceTrend: { date: string; rate: number }[];
    gradeHistory: { exam: string; marks: number; maxMarks: number }[];
  };
}

export function StudentDashboard({ student, serverData }: StudentDashboardProps) {
  const attendancePct = serverData?.attendancePct ?? 0;
  const outstandingFees = serverData?.outstandingFees ?? 0;
  const publishedResultsCount = serverData?.publishedResultsCount ?? 0;
  const pendingAssignments = serverData?.pendingAssignments ?? 0;
  const unreadNotices = serverData?.unreadNotices ?? 0;
  const classesToday = serverData?.classesToday ?? 0;
  const attendanceTrend = serverData?.attendanceTrend || [];
  const gradeHistory = serverData?.gradeHistory || [];

  const outstandingFeesStr = outstandingFees > 0 ? `₹${outstandingFees.toLocaleString()}` : "Cleared";

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={student?.profiles?.avatar_url || ""} />
          <AvatarFallback className="text-xl">{student?.profiles?.first_name?.charAt(0)}{student?.profiles?.last_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome, {student?.profiles?.first_name}!</h2>
          <p className="text-muted-foreground">
            {student?.courses?.name} • Semester {student?.semesters?.semester_number}
          </p>
        </div>
      </div>
      
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Attendance</CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-lg sm:text-2xl font-bold ${attendancePct >= 75 ? "text-green-600" : "text-red-500"}`}>
              {attendancePct > 0 ? `${attendancePct}%` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current semester attendance</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Timetable</CardTitle>
            <BookOpen className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
             <div className="text-lg sm:text-2xl font-bold text-primary">{classesToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Classes scheduled for today</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = "/my-assignments"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Assignments</CardTitle>
            <ClipboardList className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{pendingAssignments}</div>
            <p className="text-xs text-muted-foreground mt-1">Published assignments</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Results</CardTitle>
            <FileText className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-primary">{publishedResultsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Published subject results</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Fees Outstanding</CardTitle>
            <Banknote className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-lg sm:text-2xl font-bold ${outstandingFees > 0 ? 'text-red-600' : 'text-green-600'}`}>{outstandingFeesStr}</div>
            <p className="text-xs text-muted-foreground mt-1">{outstandingFees > 0 ? 'Pending fee balance' : 'No pending dues'}</p>
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

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Attendance Trend (Recent)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {attendanceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(v: any) => `${v}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="Attendance %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No attendance data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grade History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Grade History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {gradeHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="exam" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="marks" name="Marks Obtained" radius={[4, 4, 0, 0]}>
                      {gradeHistory.map((entry, i) => (
                        <Cell key={i} fill={(entry.marks / entry.maxMarks) * 100 >= 50 ? "#10b981" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No results data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
