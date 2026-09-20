/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  GraduationCap, Users, CalendarCheck, Banknote, FileText,
  BookOpen, Home, Bus, Briefcase, Download, Printer,
  Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStudentReport, getAttendanceReport, getFeeReport,
  getResultReport, getFacultyReport, getLibraryReport,
  getHostelReport, getTransportReport, getPlacementReport,
} from "./actions";

const PAGE_SIZE = 20;

// ─── Export Helpers ─────────────────────────────────────────

function exportToCSV(data: any[], filename: string) {
  if (!data.length) { toast.error("No data to export"); return; }
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        const str = val === null || val === undefined ? "" : String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast.success("CSV downloaded");
}

async function exportToExcel(data: any[], filename: string) {
  if (!data.length) { toast.error("No data to export"); return; }
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
  toast.success("Excel downloaded");
}

async function exportToPDF(data: any[], title: string) {
  if (!data.length) { toast.error("No data to export"); return; }
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 22);

  const headers = Object.keys(data[0]);
  const colWidths = headers.map(() => Math.max(20, 180 / headers.length));
  const startX = 14;
  let y = 30;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  headers.forEach((h, i) => {
    const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(h, x + 2, y);
  });

  y += 6;
  doc.setFont("helvetica", "normal");
  data.slice(0, 40).forEach((row) => {
    if (y > 190) { doc.addPage(); y = 20; }
    headers.forEach((h, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      const val = row[h];
      doc.text(String(val === null || val === undefined ? "" : val).slice(0, 30), x + 2, y);
    });
    y += 5;
  });

  doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
  toast.success("PDF downloaded");
}

function printTable() {
  window.print();
}

// ─── Pagination Component ──────────────────────────────────

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-4 print:hidden">
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {getVisiblePages().map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-2 text-muted-foreground">...</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          )
        )}
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <Card className="print:shadow-none">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// ─── Export Bar ────────────────────────────────────────────

function ExportBar({ data, filename, title }: { data: any[]; filename: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 print:hidden">
      <Button variant="outline" size="sm" onClick={() => exportToCSV(data, filename)}>
        <Download className="w-3 h-3 mr-1" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportToExcel(data, filename)}>
        <Download className="w-3 h-3 mr-1" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportToPDF(data, title)}>
        <Download className="w-3 h-3 mr-1" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={printTable}>
        <Printer className="w-3 h-3 mr-1" /> Print
      </Button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

export function ReportsClient({ overview }: { overview: any }) {
  const [activeTab, setActiveTab] = useState("students");
  const [loading, setLoading] = useState(false);

  // Tab-specific data
  const [studentData, setStudentData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [feeData, setFeeData] = useState<any>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [facultyData, setFacultyData] = useState<any>(null);
  const [libraryData, setLibraryData] = useState<any>(null);
  const [hostelData, setHostelData] = useState<any>(null);
  const [transportData, setTransportData] = useState<any>(null);
  const [placementData, setPlacementData] = useState<any>(null);

  // Pagination states per tab
  const [studentPage, setStudentPage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const [feePage, setFeePage] = useState(1);
  const [resultPage, setResultPage] = useState(1);
  const [facultyPage, setFacultyPage] = useState(1);

  const fetchTabData = useCallback(async (tab: string) => {
    setLoading(true);
    try {
      switch (tab) {
        case "students":
          if (!studentData) { const d = await getStudentReport(); if (!d.error) setStudentData(d); }
          break;
        case "attendance":
          if (!attendanceData) { const d = await getAttendanceReport(); if (!d.error) setAttendanceData(d); }
          break;
        case "fees":
          if (!feeData) { const d = await getFeeReport(); if (!d.error) setFeeData(d); }
          break;
        case "results":
          if (!resultData) { const d = await getResultReport(); if (!d.error) setResultData(d); }
          break;
        case "faculty":
          if (!facultyData) { const d = await getFacultyReport(); if (!d.error) setFacultyData(d); }
          break;
        case "library":
          if (!libraryData) { const d = await getLibraryReport(); setLibraryData(d); }
          break;
        case "hostel":
          if (!hostelData) { const d = await getHostelReport(); setHostelData(d); }
          break;
        case "transport":
          if (!transportData) { const d = await getTransportReport(); setTransportData(d); }
          break;
        case "placement":
          if (!placementData) { const d = await getPlacementReport(); setPlacementData(d); }
          break;
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [studentData, attendanceData, feeData, resultData, facultyData, libraryData, hostelData, transportData, placementData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate data fetch pattern
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  // Helper to paginate data
  function paginate(data: any[] | undefined, page: number) {
    if (!data) return { items: [], totalPages: 0 };
    const totalPages = Math.ceil(data.length / PAGE_SIZE);
    const items = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return { items, totalPages };
  }

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .report-print-area, .report-print-area * { visibility: visible; }
          .report-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>

      <div className="report-print-area">
        <Tabs value={activeTab} onValueChange={(val: string | null) => val && setActiveTab(val)}>
          <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 flex-wrap print:hidden">
            <TabsTrigger value="students" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">
              <GraduationCap className="w-4 h-4 mr-1" /> Students
            </TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">
              <CalendarCheck className="w-4 h-4 mr-1" /> Attendance
            </TabsTrigger>
            <TabsTrigger value="fees" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">
              <Banknote className="w-4 h-4 mr-1" /> Fees
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">
              <FileText className="w-4 h-4 mr-1" /> Results
            </TabsTrigger>
            <TabsTrigger value="faculty" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">
              <Users className="w-4 h-4 mr-1" /> Faculty
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">
              <BookOpen className="w-4 h-4 mr-1" /> Library
            </TabsTrigger>
            <TabsTrigger value="hostel" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">
              <Home className="w-4 h-4 mr-1" /> Hostel
            </TabsTrigger>
            <TabsTrigger value="transport" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">
              <Bus className="w-4 h-4 mr-1" /> Transport
            </TabsTrigger>
            <TabsTrigger value="placement" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4">
              <Briefcase className="w-4 h-4 mr-1" /> Placement
            </TabsTrigger>
          </TabsList>

          {loading && (
            <div className="flex items-center justify-center py-12 print:hidden">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading data...
            </div>
          )}

          {/* ═══════════════ STUDENTS TAB ═══════════════ */}
          <TabsContent value="students">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard label="Total Students" value={studentData?.total ?? overview.totalStudents} icon={GraduationCap} />
              <StatCard label="Active" value={studentData?.active ?? "—"} icon={Users} />
              <StatCard label="Inactive" value={studentData?.inactive ?? "—"} icon={Users} />
            </div>
            <ExportBar data={studentData?.data || []} filename="students_report" title="Students Report" />
            <Card className="print:shadow-none">
              <CardHeader><CardTitle>Student List</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const { items, totalPages } = paginate(studentData?.data, studentPage);
                  return (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Admission No</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Section</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((s: any) => (
                            <TableRow key={s.id}>
                              <TableCell className="font-medium">{s.name}</TableCell>
                              <TableCell className="font-mono text-xs">{s.admissionNumber}</TableCell>
                              <TableCell>{s.department}</TableCell>
                              <TableCell>{s.course}</TableCell>
                              <TableCell>{s.section}</TableCell>
                              <TableCell>
                                <Badge variant={s.status === "ACTIVE" ? "default" : "secondary"}>{s.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {items.length === 0 && (
                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No data</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <Pagination page={studentPage} totalPages={totalPages} onPageChange={setStudentPage} />
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ ATTENDANCE TAB ═══════════════ */}
          <TabsContent value="attendance">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard label="Overall Rate" value={`${attendanceData?.overallRate ?? overview.attendanceRate}%`} icon={CalendarCheck} />
              <StatCard label="Shortage (< 75%)" value={attendanceData?.shortageCount ?? "—"} icon={CalendarCheck} />
              <StatCard label="Total Records" value={attendanceData?.totalRecords ?? "—"} icon={CalendarCheck} />
            </div>
            <ExportBar data={attendanceData?.summary || []} filename="attendance_report" title="Attendance Report" />
            <Card className="print:shadow-none">
              <CardHeader><CardTitle>Attendance by Department</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const { items, totalPages } = paginate(attendanceData?.summary, attendancePage);
                  return (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Department ID</TableHead>
                            <TableHead className="text-right">Total Records</TableHead>
                            <TableHead className="text-right">Present</TableHead>
                            <TableHead className="text-right">Rate %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((d: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{d.departmentId}</TableCell>
                              <TableCell className="text-right">{d.total}</TableCell>
                              <TableCell className="text-right">{d.present}</TableCell>
                              <TableCell className="text-right">
                                <span className={d.rate >= 75 ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                                  {d.rate}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                          {items.length === 0 && (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No data</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <Pagination page={attendancePage} totalPages={totalPages} onPageChange={setAttendancePage} />
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ FEES TAB ═══════════════ */}
          <TabsContent value="fees">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Due" value={`₹${(feeData?.totalDue ?? 0).toLocaleString()}`} icon={Banknote} />
              <StatCard label="Total Collected" value={`₹${(feeData?.totalPaid ?? 0).toLocaleString()}`} icon={Banknote} />
              <StatCard label="Outstanding" value={`₹${(feeData?.outstanding ?? 0).toLocaleString()}`} icon={Banknote} />
              <StatCard label="Collection Rate" value={`${feeData?.collectionRate ?? 0}%`} icon={Banknote} />
            </div>
            <ExportBar data={feeData?.data || []} filename="fees_report" title="Fees Report" />
            <Card className="print:shadow-none">
              <CardHeader><CardTitle>Fee Records</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const { items, totalPages } = paginate(feeData?.data, feePage);
                  return (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Admission No</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead className="text-right">Due</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="text-right">Outstanding</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((f: any) => (
                            <TableRow key={f.id}>
                              <TableCell className="font-medium">{f.student}</TableCell>
                              <TableCell className="font-mono text-xs">{f.admissionNumber}</TableCell>
                              <TableCell>{f.category}</TableCell>
                              <TableCell className="text-sm">{f.year}</TableCell>
                              <TableCell className="text-right font-mono">₹{f.amountDue.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-mono text-green-700">₹{f.paidAmount.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-mono font-bold text-red-700">₹{f.outstanding.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={f.status === "PAID" ? "default" : f.status === "PARTIAL" ? "secondary" : "destructive"}>
                                  {f.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {items.length === 0 && (
                            <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No data</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <Pagination page={feePage} totalPages={totalPages} onPageChange={setFeePage} />
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ RESULTS TAB ═══════════════ */}
          <TabsContent value="results">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard label="Published Exams" value={resultData?.totalPublished ?? overview.publishedResults} icon={FileText} />
              <StatCard label="Avg Score" value={`${resultData?.avgScore ?? 0}`} icon={FileText} />
              <StatCard label="Pass Rate" value={`${resultData?.passRate ?? 0}%`} icon={FileText} />
            </div>
            <ExportBar data={resultData?.deptSummary || []} filename="results_report" title="Results Report" />
            <Card className="print:shadow-none">
              <CardHeader><CardTitle>Results by Department</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const { items, totalPages } = paginate(resultData?.deptSummary, resultPage);
                  return (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Department</TableHead>
                            <TableHead className="text-right">Total Results</TableHead>
                            <TableHead className="text-right">Avg Marks</TableHead>
                            <TableHead className="text-right">Pass Rate %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((d: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{d.name}</TableCell>
                              <TableCell className="text-right">{d.total}</TableCell>
                              <TableCell className="text-right font-semibold">{d.avgMarks}</TableCell>
                              <TableCell className="text-right">
                                <span className={d.passRate >= 60 ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                                  {d.passRate}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                          {items.length === 0 && (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No data</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <Pagination page={resultPage} totalPages={totalPages} onPageChange={setResultPage} />
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ FACULTY TAB ═══════════════ */}
          <TabsContent value="faculty">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard label="Total Faculty" value={facultyData?.total ?? overview.totalFaculty} icon={Users} />
              <StatCard label="Departments" value={Object.keys(facultyData?.byDepartment || {}).length || overview.totalDepartments} icon={Users} />
            </div>
            <ExportBar data={facultyData?.data || []} filename="faculty_report" title="Faculty Report" />
            <Card className="print:shadow-none">
              <CardHeader><CardTitle>Faculty List</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const { items, totalPages } = paginate(facultyData?.data, facultyPage);
                  return (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead className="text-right">Subjects Assigned</TableHead>
                            <TableHead>Subjects</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((f: any) => (
                            <TableRow key={f.id}>
                              <TableCell className="font-medium">{f.name}</TableCell>
                              <TableCell>{f.department}</TableCell>
                              <TableCell>{f.designation}</TableCell>
                              <TableCell className="text-right">{f.subjectsAssigned}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{f.subjects}</TableCell>
                            </TableRow>
                          ))}
                          {items.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No data</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <Pagination page={facultyPage} totalPages={totalPages} onPageChange={setFacultyPage} />
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ LIBRARY TAB ═══════════════ */}
          <TabsContent value="library">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Books" value={libraryData?.totalBooks ?? overview.totalBooks} icon={BookOpen} />
              <StatCard label="Issued Books" value={libraryData?.issuedBooks ?? overview.issuedBooks} icon={BookOpen} />
              <StatCard label="Active Members" value={libraryData?.activeMembers ?? overview.libraryMembers} icon={Users} />
              <StatCard label="Overdue" value={libraryData?.overdueTransactions ?? overview.overdueBooks} icon={BookOpen} />
            </div>
            <Card className="print:shadow-none">
              <CardHeader><CardTitle>Library Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Inventory</h4>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Total Books</span><span className="font-mono font-bold">{libraryData?.totalBooks ?? overview.totalBooks}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Currently Issued</span><span className="font-mono font-bold">{libraryData?.issuedBooks ?? overview.issuedBooks}</span></div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Membership</h4>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Active Members</span><span className="font-mono font-bold">{libraryData?.activeMembers ?? overview.libraryMembers}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Overdue Transactions</span><span className="font-mono font-bold text-red-600">{libraryData?.overdueTransactions ?? overview.overdueBooks}</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ HOSTEL TAB ═══════════════ */}
          <TabsContent value="hostel">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Beds" value={hostelData?.totalBeds ?? overview.totalBeds} icon={Home} />
              <StatCard label="Occupied" value={hostelData?.occupiedBeds ?? overview.occupiedBeds} icon={Home} />
              <StatCard label="Available" value={(hostelData?.availableBeds ?? (overview.totalBeds - overview.occupiedBeds))} icon={Home} />
              <StatCard label="Occupancy Rate" value={`${hostelData?.occupancyRate ?? overview.hostelOccupancy}%`} icon={Home} />
            </div>
            <Card className="print:shadow-none">
              <CardHeader><CardTitle>Hostel Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 max-w-md">
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Total Beds</span><span className="font-mono font-bold">{hostelData?.totalBeds ?? overview.totalBeds}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Occupied Beds</span><span className="font-mono font-bold">{hostelData?.occupiedBeds ?? overview.occupiedBeds}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Available Beds</span><span className="font-mono font-bold text-green-600">{hostelData?.availableBeds ?? (overview.totalBeds - overview.occupiedBeds)}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Occupancy Rate</span><span className="font-mono font-bold">{hostelData?.occupancyRate ?? overview.hostelOccupancy}%</span></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ TRANSPORT TAB ═══════════════ */}
          <TabsContent value="transport">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard label="Total Buses" value={transportData?.totalBuses ?? overview.totalBuses} icon={Bus} />
              <StatCard label="Routes" value={transportData?.totalRoutes ?? overview.totalRoutes} icon={Bus} />
              <StatCard label="Assigned Students" value={transportData?.assignedStudents ?? overview.transportStudents} icon={Users} />
            </div>
            <Card className="print:shadow-none">
              <CardHeader><CardTitle>Transport Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 max-w-md">
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Total Buses</span><span className="font-mono font-bold">{transportData?.totalBuses ?? overview.totalBuses}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Total Routes</span><span className="font-mono font-bold">{transportData?.totalRoutes ?? overview.totalRoutes}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Assigned Students</span><span className="font-mono font-bold">{transportData?.assignedStudents ?? overview.transportStudents}</span></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ PLACEMENT TAB ═══════════════ */}
          <TabsContent value="placement">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard label="Companies" value={placementData?.totalCompanies ?? overview.totalCompanies} icon={Briefcase} />
              <StatCard label="Job Posts" value={placementData?.totalJobs ?? overview.totalJobs} icon={Briefcase} />
              <StatCard label="Applicants" value={placementData?.totalApplicants ?? overview.totalApplicants} icon={Users} />
              <StatCard label="Placement Rate" value={`${placementData?.placementRate ?? overview.placementRate}%`} icon={Briefcase} />
            </div>
            <Card className="print:shadow-none">
              <CardHeader><CardTitle>Placement Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 max-w-md">
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Total Companies</span><span className="font-mono font-bold">{placementData?.totalCompanies ?? overview.totalCompanies}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Job Posts</span><span className="font-mono font-bold">{placementData?.totalJobs ?? overview.totalJobs}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Total Applicants</span><span className="font-mono font-bold">{placementData?.totalApplicants ?? overview.totalApplicants}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Selected</span><span className="font-mono font-bold text-green-600">{placementData?.selectedCount ?? overview.selectedCount}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Placement Rate</span><span className="font-mono font-bold">{placementData?.placementRate ?? overview.placementRate}%</span></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
