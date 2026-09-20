/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Users, GraduationCap, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from "@/components/ui/charts";

interface HodDashboardProps {
  department: any;
  stats: {
    totalStudents: number;
    totalFaculty: number;
    avgAttendance: number;
    avgResults: number;
    departmentName: string;
  };
  chartData?: {
    facultyWorkload?: { name: string; subjects: number }[];
    attendanceBySubject?: { name: string; rate: number }[];
    resultsBySubject?: { name: string; avg: number }[];
  };
}

export function HodDashboard({ department: _department, stats, chartData }: HodDashboardProps) {
  const facultyWorkload = chartData?.facultyWorkload || [];
  const attendanceBySubject = chartData?.attendanceBySubject || [];
  const resultsBySubject = chartData?.resultsBySubject || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-xl bg-primary/10">
            <Building2 className="w-8 h-8 text-primary" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {stats.departmentName || "Department"} Dashboard
          </h2>
          <p className="text-muted-foreground">
            Head of Department View
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Students in Dept</CardTitle>
            <GraduationCap className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Active students</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Faculty in Dept</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.totalFaculty}</div>
            <p className="text-xs text-muted-foreground mt-1">Teaching staff</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Attendance</CardTitle>
            <BarChart3 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-lg sm:text-2xl font-bold ${stats.avgAttendance >= 75 ? "text-green-600" : "text-red-500"}`}>
              {stats.avgAttendance}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all students</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Marks</CardTitle>
            <BarChart3 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.avgResults}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Faculty Workload Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Faculty Workload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {facultyWorkload.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facultyWorkload} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="subjects" fill="#2563eb" name="Subjects Assigned" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance by Subject */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Attendance by Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {attendanceBySubject.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceBySubject}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(v: any) => `${v}%`} />
                    <Bar dataKey="rate" name="Attendance %" radius={[4, 4, 0, 0]}>
                      {attendanceBySubject.map((entry, i) => (
                        <Cell key={i} fill={entry.rate >= 75 ? "#10b981" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results by Subject */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Results by Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {resultsBySubject.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resultsBySubject}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(v: any) => `${v} marks`} />
                    <Bar dataKey="avg" name="Avg Marks" radius={[4, 4, 0, 0]}>
                      {resultsBySubject.map((entry, i) => (
                        <Cell key={i} fill={entry.avg >= 50 ? "#2563eb" : "#f59e0b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
