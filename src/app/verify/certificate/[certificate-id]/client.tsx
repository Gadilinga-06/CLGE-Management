/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Shield, Calendar, Award, FileText } from "lucide-react";

export function VerifyCertificateClient({
  result,
  certificateId,
}: {
  result: any;
  certificateId: string;
}) {
  const isVerified = result.verified;
  const cert = result.certificate;

  const formatDate = (d: string | null) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Privacy: only show first name + last initial
  const maskName = (name: string | null) => {
    if (!name) return "N/A";
    const parts = name.split(" ");
    if (parts.length <= 1) return parts[0]?.charAt(0) + "*****" || "N/A";
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  };

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
            {isVerified ? "Certificate Verified" : "Certificate Not Verified"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isVerified
              ? "This certificate is authentic and has been verified."
              : result.error || "This certificate could not be verified. It may have been revoked or does not exist."}
          </p>

          {/* Certificate Details */}
          {cert && (
            <div className="w-full space-y-3 text-left">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Certificate ID:</span>
                  <span className="font-mono font-medium">{cert.certificateId}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{cert.type?.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-medium ${cert.status === "VERIFIED" ? "text-green-600" : "text-red-600"}`}>
                    {cert.status}
                  </span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Student: </span>
                  <span className="font-medium">{maskName(cert.studentName)}</span>
                </div>
                {cert.courseName && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Course: </span>
                    <span className="font-medium">{cert.courseName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span className="font-medium">{formatDate(cert.issueDate)}</span>
                </div>
                {cert.validUntil && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Valid Until:</span>
                    <span className="font-medium">{formatDate(cert.validUntil)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-xs text-muted-foreground">
            <p>Verification ID: {certificateId}</p>
            <p className="mt-1">This is a public verification page. No private student information is displayed.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
