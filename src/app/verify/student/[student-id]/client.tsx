/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Shield, GraduationCap, Building2, Hash } from "lucide-react";

export function VerifyStudentClient({
  result,
  token,
}: {
  result: any;
  token: string;
}) {
  const isVerified = result.verified;
  const student = result.student;

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          {/* Status Icon */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isVerified ? "bg-green-100" : "bg-red-100"}`}>
            {isVerified ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>

          {/* Status Text */}
          <h1 className={`text-2xl font-bold mb-2 ${isVerified ? "text-green-700" : "text-red-700"}`}>
            {isVerified ? "Student Identity Verified" : "Verification Failed"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isVerified
              ? "This student ID is authentic and has been verified."
              : result.error || "This student ID could not be verified. It may be invalid or expired."}
          </p>

          {/* Student Details */}
          {student && (
            <div className="w-full space-y-3 text-left">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{student.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Admission No:</span>
                  <span className="font-mono font-medium">{student.admissionNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{student.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-medium ${student.status === "ACTIVE" ? "text-green-600" : "text-red-600"}`}>
                    {student.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-xs text-muted-foreground">
            <p>Verification Timestamp: {new Date().toLocaleString("en-IN")}</p>
            <p className="mt-1">This is a public verification page. No sensitive student data is exposed.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
