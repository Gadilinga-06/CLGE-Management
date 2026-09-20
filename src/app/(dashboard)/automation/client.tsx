/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck, Banknote, ClipboardList, FileText, Loader2,
  Play, RefreshCw, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  runAttendanceShortageCheck,
  runFeeDueReminders,
  runAssignmentDeadlineReminders,
  runExamNotifications,
  runAllAutomationsAction,
} from "./actions";

interface AutomationCardProps {
  title: string;
  description: string;
  icon: any;
  type: string;
  onRun: () => Promise<any>;
}

function AutomationCard({ title, description, icon: Icon, type, onRun }: AutomationCardProps) {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await onRun();
      setLastResult(result);
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.count > 0) {
        toast.success(`${title}: ${result.message}`);
      } else {
        toast.info(`${title}: ${result?.message || "No action needed"}`);
      }
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        
        {lastResult && !lastResult.error && (
          <div className="flex items-center gap-2 text-sm">
            {lastResult.count > 0 ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-muted-foreground">{lastResult.message}</span>
          </div>
        )}

        <Button onClick={handleRun} disabled={running} size="sm" className="w-full">
          {running ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" /> Run Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export function AutomationClient({ recentLogs }: { recentLogs: any[] }) {
  const [runningAll, setRunningAll] = useState(false);

  const handleRunAll = async () => {
    setRunningAll(true);
    try {
      const results = await runAllAutomationsAction();
      if (Array.isArray(results)) {
        const totalTriggered = results.filter((r: any) => r.triggered).length;
        const totalCount = results.reduce((sum: number, r: any) => sum + r.count, 0);
        toast.success(`All automations complete: ${totalTriggered} triggered, ${totalCount} notifications sent`);
      } else {
        toast.error("Failed to run automations");
      }
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setRunningAll(false);
    }
  };

  const automations = [
    {
      title: "Attendance Shortage Alerts",
      description: "Check all students for attendance below 75% threshold and send shortage alerts.",
      icon: CalendarCheck,
      type: "ATTENDANCE_SHORTAGE",
      onRun: runAttendanceShortageCheck,
    },
    {
      title: "Fee Due Reminders",
      description: "Find students with overdue/pending fees and send payment reminders.",
      icon: Banknote,
      type: "FEE_DUE_REMINDER",
      onRun: runFeeDueReminders,
    },
    {
      title: "Assignment Deadline Reminders",
      description: "Notify students about assignments due within the next 24 hours.",
      icon: ClipboardList,
      type: "ASSIGNMENT_DEADLINE",
      onRun: runAssignmentDeadlineReminders,
    },
    {
      title: "Exam Notifications",
      description: "Alert students about exams scheduled within the next 7 days.",
      icon: FileText,
      type: "EXAM_NOTIFICATION",
      onRun: runExamNotifications,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Run All Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Run All Automations</h3>
              <p className="text-sm text-muted-foreground">Execute all automation checks simultaneously.</p>
            </div>
            <Button onClick={handleRunAll} disabled={runningAll}>
              {runningAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" /> Run All
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Individual Automation Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {automations.map((auto) => (
          <AutomationCard key={auto.type} {...auto} />
        ))}
      </div>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Automation Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No automation logs yet. Run an automation to see results.</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    {log.triggered ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{log.automation_type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{log.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={log.triggered ? "default" : "secondary"}>
                      {log.count} affected
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.started_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
