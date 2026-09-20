/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import { Award, Download, QrCode, Calendar, Shield, ShieldOff, FileText } from "lucide-react";

const typeColors: Record<string, string> = {
  BONAFIDE: "bg-blue-100 text-blue-800 border-blue-200",
  COURSE_COMPLETION: "bg-green-100 text-green-800 border-green-200",
  INTERNSHIP: "bg-purple-100 text-purple-800 border-purple-200",
  PARTICIPATION: "bg-orange-100 text-orange-800 border-orange-200",
  CHARACTER: "bg-gray-100 text-gray-600 border-gray-200",
  EVENT: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const statusColors: Record<string, string> = {
  VERIFIED: "bg-green-100 text-green-800 border-green-200",
  REVOKED: "bg-red-100 text-red-800 border-red-200",
};

function generateCertificatePDF(cert: any) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Decorative border
  doc.setDrawColor(30, 60, 120);
  doc.setLineWidth(2);
  doc.rect(10, 10, width - 20, height - 20);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, width - 28, height - 28);

  // Inner decorative corners
  doc.setLineWidth(0.3);
  doc.line(20, 20, 40, 20);
  doc.line(20, 20, 20, 40);
  doc.line(width - 20, 20, width - 40, 20);
  doc.line(width - 20, 20, width - 20, 40);
  doc.line(20, height - 20, 40, height - 20);
  doc.line(20, height - 20, 20, height - 40);
  doc.line(width - 20, height - 20, width - 40, height - 20);
  doc.line(width - 20, height - 20, width - 20, height - 40);

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(30, 60, 120);
  doc.text("CERTIFICATE", width / 2, 45, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(80, 80, 80);
  doc.text("OF " + (cert.certificate_type || "ACHIEVEMENT").replace(/_/g, " "), width / 2, 55, { align: "center" });

  // Decorative line
  doc.setDrawColor(30, 60, 120);
  doc.setLineWidth(0.8);
  doc.line(60, 62, width - 60, 62);

  // Body text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text("This is to certify that", width / 2, 78, { align: "center" });

  // Student name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 60, 120);
  doc.text(cert.student_name || "Student Name", width / 2, 92, { align: "center" });

  // Underline for name
  const nameWidth = doc.getTextWidth(cert.student_name || "Student Name");
  doc.setLineWidth(0.3);
  doc.line(width / 2 - nameWidth / 2 - 5, 95, width / 2 + nameWidth / 2 + 5, 95);

  // Course info
  if (cert.course_name) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 60);
    doc.text(`has successfully completed ${cert.course_name}`, width / 2, 108, { align: "center" });
  }

  // Certificate type
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Certificate Type: ${(cert.certificate_type || "").replace(/_/g, " ")}`, width / 2, 120, { align: "center" });

  // Date and valid until
  const issueDate = cert.issue_date ? new Date(cert.issue_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";
  const validUntil = cert.valid_until ? new Date(cert.valid_until).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";

  doc.setFontSize(11);
  doc.text(`Date of Issue: ${issueDate}`, width / 4, 140, { align: "center" });
  doc.text(`Valid Until: ${validUntil}`, (width * 3) / 4, 140, { align: "center" });

  // Certificate ID
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Certificate ID: ${cert.certificate_id || "N/A"}`, width / 2, 152, { align: "center" });

  // Signature line
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.3);
  doc.line(width / 2 - 30, 175, width / 2 + 30, 175);
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text("Authorized Signature", width / 2, 181, { align: "center" });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("This certificate is issued by the college and can be verified online.", width / 2, height - 25, { align: "center" });

  doc.save(`certificate-${cert.certificate_id || "download"}.pdf`);
}

export function MyCertificatesClient({
  certificates,
}: {
  certificates: any[];
}) {
  const [qrCert, setQrCert] = useState<any>(null);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {certificates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No certificates yet</p>
              <p className="text-sm">Your certificates will appear here once issued.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Card key={cert.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${typeColors[cert.certificate_type] || typeColors.BONAFIDE}`}>
                    {cert.certificate_type?.replace(/_/g, " ")}
                  </span>
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColors[cert.verification_status] || ""}`}>
                    {cert.verification_status === "VERIFIED" ? (
                      <><Shield className="w-3 h-3 mr-1" /> Verified</>
                    ) : (
                      <><ShieldOff className="w-3 h-3 mr-1" /> Revoked</>
                    )}
                  </span>
                </div>
                <CardTitle className="text-base mt-2 font-mono">{cert.certificate_id}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {cert.course_name && (
                  <p className="text-sm text-muted-foreground mb-2">{cert.course_name}</p>
                )}
                <div className="space-y-1 text-xs text-muted-foreground mt-auto">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Issued: {formatDate(cert.issue_date)}</span>
                  </div>
                  {cert.valid_until && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Valid until: {formatDate(cert.valid_until)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setQrCert(cert)}
                  >
                    <QrCode className="w-3 h-3 mr-1" /> QR Code
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => generateCertificatePDF(cert)}
                  >
                    <Download className="w-3 h-3 mr-1" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={!!qrCert} onOpenChange={(open) => !open && setQrCert(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Certificate QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCert && (
              <>
                <QRCodeSVG
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/verify/certificate/${qrCert.certificate_id}`}
                  size={200}
                  level="H"
                />
                <p className="text-sm text-muted-foreground font-mono">{qrCert.certificate_id}</p>
                <p className="text-xs text-muted-foreground text-center">
                  Scan to verify this certificate
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrCert(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
