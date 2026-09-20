/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, TrendingUp, AlertCircle, Calendar, BarChart3, BookOpen, Building2, Search } from "lucide-react";
import { getStudentLedger, getDepartmentCollection } from "../actions";
import { toast } from "sonner";

type Tab = "today" | "month" | "outstanding" | "ledger" | "department";

export function ReportsClient({ todayPayments, monthPayments, outstandingFees, todayTotal, monthTotal }: {
  todayPayments: any[];
  monthPayments: any[];
  outstandingFees: any[];
  todayTotal: number;
  monthTotal: number;
}) {
  const [tab, setTab] = useState<Tab>("today");
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [deptData, setDeptData] = useState<any>(null);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptFromDate, setDeptFromDate] = useState("");
  const [deptToDate, setDeptToDate] = useState("");

  const getOutstanding = (sf: any) => {
    const effective = (sf.amount_due || 0) + (sf.late_fee_amount || 0) - (sf.scholarship_amount || 0) - (sf.discount_amount || 0);
    return Math.max(0, effective - (sf.paid_amount || 0));
  };

  const totalOutstanding = outstandingFees.reduce((s, sf) => s + getOutstanding(sf), 0);

  const byDate: Record<string, number> = {};
  monthPayments.forEach((p: any) => {
    byDate[p.payment_date] = (byDate[p.payment_date] || 0) + p.amount;
  });

  const handleLedgerSearch = async () => {
    if (!ledgerSearch.trim()) return;
    setLedgerLoading(true);
    const result = await getStudentLedger(ledgerSearch.trim());
    if (result?.error) toast.error(result.error);
    else setLedgerData(result);
    setLedgerLoading(false);
  };

  const handleDeptSearch = async () => {
    setDeptLoading(true);
    const result = await getDepartmentCollection({
      from_date: deptFromDate || undefined,
      to_date: deptToDate || undefined,
    });
    if (result?.error) toast.error(result.error);
    else setDeptData(result);
    setDeptLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTab("today")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground font-medium">Today&apos;s Collection</span>
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">₹{todayTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{todayPayments.length} transactions</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTab("month")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground font-medium">This Month</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600">₹{monthTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{monthPayments.length} transactions</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTab("outstanding")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground font-medium">Outstanding Dues</span>
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600">₹{totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{outstandingFees.length} pending records</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b pb-2 flex-wrap">
        {([
          { key: "today" as Tab, label: "Today", icon: Calendar },
          { key: "month" as Tab, label: "Monthly", icon: TrendingUp },
          { key: "outstanding" as Tab, label: "Outstanding", icon: AlertCircle },
          { key: "ledger" as Tab, label: "Student Ledger", icon: BookOpen },
          { key: "department" as Tab, label: "Department", icon: Building2 },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
          </button>
        ))}
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print Report
          </Button>
        </div>
      </div>

      {/* Today Tab */}
      {tab === "today" && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Today&apos;s Transactions</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayPayments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.receipts?.[0]?.receipt_number || "—"}</TableCell>
                    <TableCell>
                      <div className="font-medium">{p.students?.profiles?.first_name} {p.students?.profiles?.last_name}</div>
                      <div className="text-xs text-muted-foreground">{p.students?.admission_number}</div>
                    </TableCell>
                    <TableCell>{p.student_fees?.fee_structures?.category || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{p.payment_method}</Badge></TableCell>
                    <TableCell className="text-right font-mono font-semibold">₹{p.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {todayPayments.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No collections today.</TableCell></TableRow>
                )}
                {todayPayments.length > 0 && (
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell colSpan={4} className="text-right">Total Collected Today</TableCell>
                    <TableCell className="text-right font-mono">₹{todayTotal.toLocaleString()}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Month Tab */}
      {tab === "month" && (
        <Card>
          <CardHeader><CardTitle>Daily Breakdown — Current Month</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, amt]) => (
                  <TableRow key={date}>
                    <TableCell>{new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">₹{amt.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {Object.keys(byDate).length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No transactions this month.</TableCell></TableRow>
                )}
                {Object.keys(byDate).length > 0 && (
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell>Month Total</TableCell>
                    <TableCell className="text-right font-mono">₹{monthTotal.toLocaleString()}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Outstanding Tab */}
      {tab === "outstanding" && (
        <Card>
          <CardHeader><CardTitle>Outstanding Dues</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingFees.map((sf: any) => (
                  <TableRow key={sf.id}>
                    <TableCell>
                      <div className="font-medium">{sf.students?.profiles?.first_name} {sf.students?.profiles?.last_name}</div>
                      <div className="text-xs text-muted-foreground">{sf.students?.admission_number}</div>
                    </TableCell>
                    <TableCell>{sf.fee_structures?.category}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sf.fee_structures?.academic_years?.name}</TableCell>
                    <TableCell className="text-right font-mono">₹{(sf.amount_due || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-green-700">₹{(sf.paid_amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-red-700">₹{getOutstanding(sf).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={sf.status === "PARTIAL" ? "secondary" : "destructive"} className="text-xs">{sf.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {outstandingFees.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No outstanding fees. All collected!</TableCell></TableRow>
                )}
                {outstandingFees.length > 0 && (
                  <TableRow className="bg-red-50 font-bold">
                    <TableCell colSpan={5} className="text-right">Total Outstanding</TableCell>
                    <TableCell className="text-right font-mono text-red-700">₹{totalOutstanding.toLocaleString()}</TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Student Ledger Tab */}
      {tab === "ledger" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Student Ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 max-w-md mb-6">
              <Input
                placeholder="Enter Admission Number..."
                value={ledgerSearch}
                onChange={e => setLedgerSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLedgerSearch()}
              />
              <Button onClick={handleLedgerSearch} disabled={ledgerLoading}>
                <Search className="w-4 h-4 mr-2" />
                {ledgerLoading ? "Loading..." : "Search"}
              </Button>
            </div>

            {ledgerData && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-bold">{ledgerData.student?.profiles?.first_name} {ledgerData.student?.profiles?.last_name}</h3>
                  <p className="text-sm text-muted-foreground">Admission No: {ledgerData.student?.admission_number}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold">₹{ledgerData.fees?.reduce((s: number, f: any) => s + (f.amount_due || 0), 0).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total Assigned</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">₹{ledgerData.payments?.reduce((s: number, p: any) => s + p.amount, 0).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total Paid</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">₹{ledgerData.refunds?.reduce((s: number, r: any) => s + r.amount, 0).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total Refunded</div>
                  </div>
                </div>

                <h4 className="font-semibold text-sm">Fee Assignments</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Late Fee</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerData.fees?.map((f: any) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.fee_structures?.category}</TableCell>
                        <TableCell className="text-sm">{f.fee_structures?.academic_years?.name}</TableCell>
                        <TableCell className="text-right font-mono">₹{(f.amount_due || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-green-700">₹{(f.paid_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-orange-600">
                          {(f.late_fee_amount || 0) > 0 ? `₹${f.late_fee_amount.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={f.status === "PAID" ? "default" : f.status === "PARTIAL" ? "secondary" : "destructive"} className="text-xs">
                            {f.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {ledgerData.payments?.length > 0 && (
                  <>
                    <h4 className="font-semibold text-sm">Payment History</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledgerData.payments.map((p: any) => (
                          <TableRow key={p.id}>
                            <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                            <TableCell><Badge variant="outline">{p.payment_method}</Badge></TableCell>
                            <TableCell className="font-mono text-xs">{p.reference_number || "—"}</TableCell>
                            <TableCell className="text-right font-mono font-semibold text-green-700">₹{p.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={p.status === "REFUNDED" ? "destructive" : "outline"} className="text-xs">{p.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}

                {ledgerData.refunds?.length > 0 && (
                  <>
                    <h4 className="font-semibold text-sm text-orange-700">Refunds</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledgerData.refunds.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-sm">{r.reason || "—"}</TableCell>
                            <TableCell><Badge variant="outline">{r.refund_method}</Badge></TableCell>
                            <TableCell className="text-right font-mono font-semibold text-red-700">₹{r.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Department Collection Tab */}
      {tab === "department" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Department Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 max-w-2xl mb-6 items-end">
              <div className="space-y-1 flex-1">
                <Label className="text-xs">From Date</Label>
                <Input type="date" value={deptFromDate} onChange={e => setDeptFromDate(e.target.value)} />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">To Date</Label>
                <Input type="date" value={deptToDate} onChange={e => setDeptToDate(e.target.value)} />
              </div>
              <Button onClick={handleDeptSearch} disabled={deptLoading} className="mb-0.5">
                <Search className="w-4 h-4 mr-2" />
                {deptLoading ? "Loading..." : "Filter"}
              </Button>
            </div>

            {deptData && (
              <>
                <div className="p-4 bg-muted/30 rounded-lg mb-4 text-right">
                  <span className="text-sm text-muted-foreground">Total Collected: </span>
                  <span className="text-2xl font-bold text-primary">₹{deptData.totalCollected?.toLocaleString()}</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Amount Collected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deptData.departments?.map((d: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="text-right">{d.count}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">₹{d.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {(!deptData.departments || deptData.departments.length === 0) && (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No data found for the selected period.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
