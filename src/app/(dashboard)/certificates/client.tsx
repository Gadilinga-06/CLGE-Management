/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createCertificate, revokeCertificate } from "../certificates/actions";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import {
  Plus, Award, Shield, ShieldOff, Download, QrCode,
  CheckCircle, XCircle, FileText, Calendar,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const typeColors: Record<string, string> = {
  BONAFIDE: "bg-blue-100 text-blue-800 border-blue-200",
  COURSE_COMPLETION: "bg-green-100 text-green-800 border-green-200",
  INTERNSHIP: "bg-purple-100 text-purple-800 border-purple-200",
  PARTICIPATION: "bg-orange-100 text-orange-800 border-orange-200",
  CHARACTER: "bg-gray-100 text-gray-600 border-gray-200",
  EVENT: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const statusBadgeColors: Record<string, string> = {
  VERIFIED: "bg-green-100 text-green-800 border-green-200",
  REVOKED: "bg-red-100 text-red-800 border-red-200",
};

const CERT_TYPES = ["BONAFIDE", "COURSE_COMPLETION", "INTERNSHIP", "PARTICIPATION", "CHARACTER", "EVENT"];

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

export function CertificatesClient({
  certificates,
  students,
}: {
  certificates: any[];
  students: any[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [qrCert, setQrCert] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const verifiedCount = certificates.filter((c) => c.verification_status === "VERIFIED").length;
  const revokedCount = certificates.filter((c) => c.verification_status === "REVOKED").length;

  const typeCounts: Record<string, number> = {};
  for (const cert of certificates) {
    typeCounts[cert.certificate_type] = (typeCounts[cert.certificate_type] || 0) + 1;
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createCertificate(new FormData(e.currentTarget));
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Certificate created successfully");
      setCreateOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleRevoke = async () => {
    if (!revokeId) return;
    const result = await revokeCertificate(revokeId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Certificate revoked");
      setRevokeOpen(false);
      setRevokeId(null);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredStudents = students.filter((s: any) => {
    const name = `${s.profiles?.first_name || ""} ${s.profiles?.last_name || ""}`.toLowerCase();
    const adm = (s.admission_number || "").toLowerCase();
    const search = studentSearch.toLowerCase();
    return name.includes(search) || adm.includes(search);
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</span>
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{certificates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Verified</span>
              <Shield className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revoked</span>
              <ShieldOff className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{revokedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Types</span>
              <Award className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">{Object.keys(typeCounts).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Button */}
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Certificate
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cert ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-mono text-xs">{cert.certificate_id}</TableCell>
                  <TableCell className="text-sm">{cert.student_name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${typeColors[cert.certificate_type] || typeColors.BONAFIDE}`}>
                      {cert.certificate_type?.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(cert.issue_date)}</TableCell>
                  <TableCell className="text-sm">{formatDate(cert.valid_until)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusBadgeColors[cert.verification_status] || ""}`}>
                      {cert.verification_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setQrCert(cert)}>
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => generateCertificatePDF(cert)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      {cert.verification_status === "VERIFIED" && (
                        <Button size="sm" variant="ghost" onClick={() => { setRevokeId(cert.id); setRevokeOpen(true); }}>
                          <ShieldOff className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {certificates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No certificates found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Certificate Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Certificate</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Student *</Label>
                <Input
                  placeholder="Search student by name or admission number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="mb-2"
                />
                <Select name="student_id" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.profiles?.first_name} {s.profiles?.last_name} ({s.admission_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Certificate Type *</Label>
                <Select name="certificate_type" required defaultValue="BONAFIDE">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CERT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Input name="issue_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input name="valid_until" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Course Name</Label>
                <Input name="course_name" placeholder="e.g. B.Tech Computer Science" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

      {/* Revoke Confirmation */}
      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Certificate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this certificate? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-white hover:bg-destructive/90">
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
