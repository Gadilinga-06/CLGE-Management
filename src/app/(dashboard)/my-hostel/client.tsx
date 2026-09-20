/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitComplaint } from "../hostel/actions";
import { Building2, BedDouble, Wifi, Wind, Bath, AlertCircle, Plus } from "lucide-react";

const CATEGORIES = ["MAINTENANCE", "CLEANLINESS", "FOOD", "SECURITY", "NOISE", "OTHER"];

export function MyHostelClient({ student, allocation, complaints, visitors, hostels, collegeId }: {
  student: any; allocation: any; complaints: any[]; visitors: any[]; hostels: any[]; collegeId: string;
}) {
  const [complaintDialog, setComplaintDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplaint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await submitComplaint(new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Complaint submitted. The warden will review it."); setComplaintDialog(false); }
    setIsSubmitting(false);
  };

  if (!student) {
    return (
      <Card><CardContent className="py-12 text-center">
        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-muted-foreground">No student profile found.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Room Card */}
      {allocation ? (
        <Card className="border-l-4 border-l-primary">
          <CardHeader><CardTitle className="flex items-center gap-2"><BedDouble className="w-5 h-5" /> Your Room</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground block text-xs uppercase tracking-wider">Hostel</span><span className="font-semibold">{allocation.hostel_beds?.hostel_rooms?.hostel_blocks?.hostels?.name}</span></div>
              <div><span className="text-muted-foreground block text-xs uppercase tracking-wider">Block / Floor</span><span className="font-semibold">{allocation.hostel_beds?.hostel_rooms?.hostel_blocks?.name}, Floor {allocation.hostel_beds?.hostel_rooms?.hostel_blocks?.floor_number}</span></div>
              <div><span className="text-muted-foreground block text-xs uppercase tracking-wider">Room</span><span className="font-semibold">{allocation.hostel_beds?.hostel_rooms?.room_number} ({allocation.hostel_beds?.hostel_rooms?.room_type})</span></div>
              <div><span className="text-muted-foreground block text-xs uppercase tracking-wider">Bed</span><span className="font-semibold">{allocation.hostel_beds?.bed_number}</span></div>
            </div>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {allocation.hostel_beds?.hostel_rooms?.has_ac && (
                <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"><Wind className="w-3 h-3" /> AC</span>
              )}
              {allocation.hostel_beds?.hostel_rooms?.has_attached_bath && (
                <span className="flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full"><Bath className="w-3 h-3" /> Attached Bath</span>
              )}
              {allocation.hostel_beds?.hostel_rooms?.monthly_rent > 0 && (
                <span className="text-xs text-muted-foreground ml-auto">Monthly Rent: ₹{allocation.hostel_beds.hostel_rooms.monthly_rent}</span>
              )}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Allocated on {new Date(allocation.allocation_date).toLocaleDateString()}</div>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-8 text-center">
          <BedDouble className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-muted-foreground">You are not currently allocated to a hostel bed.</p>
          <p className="text-xs text-muted-foreground mt-1">Contact the warden to request a bed.</p>
        </CardContent></Card>
      )}

      {/* Complaints Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> My Complaints</CardTitle>
          {allocation && (
            <Button size="sm" onClick={() => setComplaintDialog(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Complaint
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground text-sm">No complaints submitted.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Filed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map(c => (
                  <TableRow key={c.id}>
                    <TableCell><Badge variant="outline" className="text-xs">{c.category}</Badge></TableCell>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "RESOLVED" ? "default" : c.status === "OPEN" ? "destructive" : "secondary"} className={c.status === "RESOLVED" ? "bg-green-500" : ""}>{c.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Visitor History */}
      {visitors.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Visitors</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Relation</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.visitor_name}</TableCell>
                    <TableCell className="text-sm">{v.relation || "—"}</TableCell>
                    <TableCell className="text-sm">{new Date(v.check_in_time).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{v.check_out_time ? new Date(v.check_out_time).toLocaleString() : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={v.status === "CHECKED_IN" ? "secondary" : "default"} className={v.status === "CHECKED_IN" ? "bg-green-100 text-green-800" : ""}>{v.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Submit Complaint Dialog */}
      <Dialog open={complaintDialog} onOpenChange={setComplaintDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Hostel Complaint</DialogTitle></DialogHeader>
          <form onSubmit={handleComplaint}>
            <div className="space-y-4 py-4">
              <input type="hidden" name="hostel_id" value={allocation?.hostel_beds?.hostel_rooms?.hostel_blocks?.hostels?.id || hostels[0]?.id || ""} />
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select name="category" required>
                  <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Title *</Label><Input name="title" required placeholder="Brief description of issue" /></div>
              <div className="space-y-2">
                <Label>Details *</Label>
                <Textarea name="description" required placeholder="Describe the issue in detail..." rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setComplaintDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
