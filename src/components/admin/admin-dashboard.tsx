/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap, Users, Building2, CalendarCheck, Banknote,
  FileText, Briefcase, BookOpen, Home, Bus,
  BarChart3, PieChart as PieChartIcon, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "@/components/ui/charts";

const COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

interface AdminDashboardProps {
  stats: {
    totalStudents: number;
    totalFaculty: number;
    totalDepartments: number;
    todayAttendanceRate: number;
    monthFeeCollection: number;
    publishedResults: number;
    placementRate: number;
    libraryMembers: number;
    hostelOccupancy: number;
    transportStudents: number;
  };
  chartData?: {
    studentsByDept?: { name: string; count: number }[];
    attendanceTrend?: { day: string; rate: number }[];
    feeCollection?: { collected: number; outstanding: number };
  };
}

export function AdminDashboard({ stats, chartData }: AdminDashboardProps) {
  const studentsByDept = chartData?.studentsByDept || [];
  const attendanceTrend = chartData?.attendanceTrend || [];
  const feePieData = chartData?.feeCollection
    ? [
        { name: "Collected", value: chartData.feeCollection.collected },
        { name: "Outstanding", value: chartData.feeCollection.outstanding },
      ]
    : [
        { name: "Collected", value: stats.monthFeeCollection },
        { name: "Outstanding", value: Math.round(stats.monthFeeCollection * 0.15) },
      ];

  const statCards = [
    { label: "Students", value: stats.totalStudents.toLocaleString(), icon: GraduationCap, color: "text-blue-600" },
    { label: "Faculty", value: stats.totalFaculty.toLocaleString(), icon: Users, color: "text-emerald-600" },
    { label: "Departments", value: stats.totalDepartments.toString(), icon: Building2, color: "text-violet-600" },
    { label: "Attendance Today", value: `${stats.todayAttendanceRate}%`, icon: CalendarCheck, color: "text-amber-600" },
    { label: "Fees This Month", value: `₹${stats.monthFeeCollection.toLocaleString()}`, icon: Banknote, color: "text-green-600" },
    { label: "Results Published", value: stats.publishedResults.toLocaleString(), icon: FileText, color: "text-cyan-600" },
    { label: "Placement Rate", value: `${stats.placementRate}%`, icon: Briefcase, color: "text-indigo-600" },
    { label: "Library Members", value: stats.libraryMembers.toLocaleString(), icon: BookOpen, color: "text-orange-600" },
    { label: "Hostel Occupancy", value: `${stats.hostelOccupancy}%`, icon: Home, color: "text-pink-600" },
    { label: "Transport Students", value: stats.transportStudents.toLocaleString(), icon: Bus, color: "text-teal-600" },
  ];

  const quickLinks = [
    { label: "Students", href: "/students", icon: GraduationCap },
    { label: "Faculty", href: "/faculty", icon: Users },
    { label: "Finance Reports", href: "/finance/reports", icon: Banknote },
    { label: "Placement", href: "/placement", icon: Briefcase },
    { label: "Library", href: "/library", icon: BookOpen },
    { label: "Reports", href: "/reports", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of the college management system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium">{card.label}</CardTitle>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Bar Chart — Students by Department */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Students by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {studentsByDept.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentsByDept}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                      {studentsByDept.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
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

        {/* Pie Chart — Fee Collection Status */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" /> Fee Collection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {feePieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Line Chart — Attendance Trend */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Attendance Trend (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {attendanceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: any) => `${value}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="Attendance %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary">
                <CardContent className="flex flex-col items-center justify-center py-4 sm:py-6 gap-2">
                  <link.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
