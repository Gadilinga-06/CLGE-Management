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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  createEvent, updateEvent, deleteEvent,
  registerForEvent, cancelRegistration, markAttendance,
} from "../events/actions";
import {
  Plus, Calendar, MapPin, Users, Edit, Trash2,
  CheckCircle, XCircle, Clock, CalendarCheck, PartyPopper,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categoryColors: Record<string, string> = {
  WORKSHOP: "bg-blue-100 text-blue-800 border-blue-200",
  SEMINAR: "bg-purple-100 text-purple-800 border-purple-200",
  CULTURAL: "bg-pink-100 text-pink-800 border-pink-200",
  SPORTS: "bg-green-100 text-green-800 border-green-200",
  GENERAL: "bg-gray-100 text-gray-600 border-gray-200",
};

const statusColors: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800 border-blue-200",
  ONGOING: "bg-orange-100 text-orange-800 border-orange-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const CATEGORIES = ["WORKSHOP", "SEMINAR", "CULTURAL", "SPORTS", "GENERAL"];
const STATUSES = ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"];

export function EventsClient({
  events,
  registrations,
  myRegistrations,
  registrationMap,
  isStaff,
  studentId,
}: {
  events: any[];
  registrations: any[];
  myRegistrations: any[];
  registrationMap: Record<string, { total: number; registered: number; attended: number }>;
  isStaff: boolean;
  studentId?: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [attendanceEvent, setAttendanceEvent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upcomingCount = events.filter((e) => e.status === "UPCOMING").length;
  const ongoingCount = events.filter((e) => e.status === "ONGOING").length;
  const completedCount = events.filter((e) => e.status === "COMPLETED").length;

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createEvent(new FormData(e.currentTarget));
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Event created successfully");
      setCreateOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editEvent) return;
    setIsSubmitting(true);
    const result = await updateEvent(editEvent.id, new FormData(e.currentTarget));
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Event updated successfully");
      setEditEvent(null);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteEventId) return;
    const result = await deleteEvent(deleteEventId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Event deleted");
      setDeleteOpen(false);
      setDeleteEventId(null);
    }
  };

  const handleRegister = async (eventId: string) => {
    const result = await registerForEvent(eventId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Registered successfully");
    }
  };

  const handleCancel = async (eventId: string) => {
    const result = await cancelRegistration(eventId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Registration cancelled");
    }
  };

  const handleMarkAttendance = async (registrationId: string) => {
    const result = await markAttendance(registrationId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Attendance marked");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Events</span>
              <PartyPopper className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Upcoming</span>
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{upcomingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live</span>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{ongoingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Button */}
      {isStaff && (
        <div className="flex justify-end">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Event
          </Button>
        </div>
      )}

      {/* Tabs for staff */}
      {isStaff ? (
        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="registrations">All Registrations</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Registrations</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => {
                      const counts = registrationMap[event.id] || { total: 0, registered: 0, attended: 0 };
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">{event.title}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${categoryColors[event.category] || categoryColors.GENERAL}`}>
                              {event.category}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{event.venue || "—"}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(event.start_date)} - {formatDate(event.end_date)}
                          </TableCell>
                          <TableCell className="text-sm">{event.capacity || "∞"}</TableCell>
                          <TableCell className="text-sm">{counts.total}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColors[event.status] || statusColors.UPCOMING}`}>
                              {event.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button size="sm" variant="outline" onClick={() => setEditEvent(event)}>
                                <Edit className="w-3 h-3 mr-1" /> Edit
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setAttendanceEvent(event)}>
                                <CheckCircle className="w-3 h-3 mr-1" /> Attendance
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => { setDeleteEventId(event.id); setDeleteOpen(true); }}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {events.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No events found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registrations">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">
                          {events.find((e) => e.id === reg.event_id)?.title || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {reg.students?.profiles?.first_name} {reg.students?.profiles?.last_name}
                        </TableCell>
                        <TableCell className="text-sm">{reg.students?.admission_number || "—"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColors[reg.status] || ""}`}>
                            {reg.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{formatDateTime(reg.registered_at)}</TableCell>
                        <TableCell className="text-right">
                          {reg.status === "REGISTERED" && (
                            <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(reg.id)}>
                              <CheckCircle className="w-3 h-3 mr-1" /> Mark Attended
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {registrations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No registrations found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* Student View */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const counts = registrationMap[event.id] || { total: 0, registered: 0, attended: 0 };
                  const myReg = myRegistrations.find((r) => r.event_id === event.id);
                  const isFull = event.capacity ? counts.registered >= event.capacity : false;
                  const isRegistered = !!myReg && myReg.status === "REGISTERED";
                  const isCancelled = !!myReg && myReg.status === "CANCELLED";

                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{event.title}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${categoryColors[event.category] || categoryColors.GENERAL}`}>
                          {event.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{event.venue || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(event.start_date)} - {formatDate(event.end_date)}
                      </TableCell>
                      <TableCell className="text-sm">{event.capacity || "∞"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColors[event.status] || statusColors.UPCOMING}`}>
                          {event.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isRegistered ? (
                          <Button size="sm" variant="destructive" onClick={() => handleCancel(event.id)}>
                            <XCircle className="w-3 h-3 mr-1" /> Cancel
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isFull || event.status === "CANCELLED" || event.status === "COMPLETED"}
                            onClick={() => handleRegister(event.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Register
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {events.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No events available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Event Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input name="title" required placeholder="Event title" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" placeholder="Event description" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select name="category" defaultValue="GENERAL">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input name="venue" placeholder="Event venue" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input name="start_date" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input name="end_date" type="datetime-local" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Capacity (optional)</Label>
                <Input name="capacity" type="number" min="1" placeholder="Max participants" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Event"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editEvent} onOpenChange={(open) => !open && setEditEvent(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input name="title" required defaultValue={editEvent?.title || ""} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" defaultValue={editEvent?.description || ""} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select name="category" defaultValue={editEvent?.category || "GENERAL"}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input name="venue" defaultValue={editEvent?.venue || ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input name="start_date" type="datetime-local" required defaultValue={editEvent?.start_date?.slice(0, 16) || ""} />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input name="end_date" type="datetime-local" required defaultValue={editEvent?.end_date?.slice(0, 16) || ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input name="capacity" type="number" min="1" defaultValue={editEvent?.capacity || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editEvent?.status || "UPCOMING"}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditEvent(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={!!attendanceEvent} onOpenChange={(open) => !open && setAttendanceEvent(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark Attendance - {attendanceEvent?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
            {registrations
              .filter((r) => r.event_id === attendanceEvent?.id && r.status === "REGISTERED")
              .map((reg) => (
                <div key={reg.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{reg.students?.profiles?.first_name} {reg.students?.profiles?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{reg.students?.admission_number}</p>
                  </div>
                  <Button size="sm" onClick={() => handleMarkAttendance(reg.id)}>
                    <CheckCircle className="w-3 h-3 mr-1" /> Mark
                  </Button>
                </div>
              ))}
            {registrations.filter((r) => r.event_id === attendanceEvent?.id && r.status === "REGISTERED").length === 0 && (
              <p className="text-center text-muted-foreground py-4">No registered students to mark attendance.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceEvent(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
