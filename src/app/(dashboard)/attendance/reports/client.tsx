/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Users } from "lucide-react";

export function AttendanceReportsClient({ data }: { data: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter((d) => 
    d.profiles?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.profiles?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.admission_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = data.length;
  const criticalShortage = data.filter(d => d.total_sessions > 0 && d.percentage < 75).length;
  const goodStanding = data.filter(d => d.total_sessions > 0 && d.percentage >= 75).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Tracked</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Students across all active sections</p>
          </CardContent>
        </Card>
        
        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-red-600">Shortage Warnings</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalShortage}</div>
            <p className="text-xs text-muted-foreground mt-1">Students below 75% threshold</p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-green-600">Good Standing</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{goodStanding}</div>
            <p className="text-xs text-muted-foreground mt-1">Students meeting attendance criteria</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={[
              { 
                header: "Student", 
                accessor: (row) => (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={row.profiles?.avatar_url || ""} />
                      <AvatarFallback>{row.profiles?.first_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{row.profiles?.first_name} {row.profiles?.last_name}</span>
                      <span className="text-xs text-muted-foreground">{row.admission_number}</span>
                    </div>
                  </div>
                )
              },
              { header: "Course / Section", accessor: (row) => `${row.courses?.name} - ${row.sections?.name}` },
              { header: "Total Classes", accessor: "total_sessions" },
              { header: "Classes Attended", accessor: "present_sessions" },
              { 
                header: "Percentage", 
                accessor: (row) => {
                  if (row.total_sessions === 0) return <Badge variant="secondary">N/A</Badge>;
                  const isShortage = row.percentage < 75;
                  return (
                    <Badge variant={isShortage ? "destructive" : "default"} className={!isShortage ? "bg-green-500 hover:bg-green-600" : ""}>
                      {row.percentage}%
                    </Badge>
                  );
                }
              }
            ]}
            data={filteredData}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by name or admission number..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
