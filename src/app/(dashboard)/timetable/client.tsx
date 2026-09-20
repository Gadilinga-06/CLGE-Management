/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { createTimetableSlot, deleteTimetableSlot } from "./actions";
import { toast } from "sonner";
import { Printer, Trash2, Calendar, MapPin, User, Clock } from "lucide-react";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const TIMES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

export function TimetableClient({ sections, subjects, faculty, rooms, slots, userRole, userId }: { sections: any[], subjects: any[], faculty: any[], rooms: any[], slots: any[], userRole: string, userId: string }) {
  const [viewMode, setViewMode] = useState<"SECTION" | "FACULTY" | "ROOM">("SECTION");
  const [activeFilterId, setActiveFilterId] = useState<string>("");
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedDay, setSelectedDay] = useState("MONDAY");
  const [selectedTime, setSelectedTime] = useState("09:00");

  const isAdmin = userRole === "ADMIN";

  // Filter slots based on current view
  const filteredSlots = slots.filter(s => {
    if (!activeFilterId) return false;
    if (viewMode === "SECTION") return s.section_id === activeFilterId;
    if (viewMode === "FACULTY") return s.faculty_id === activeFilterId;
    if (viewMode === "ROOM") return s.room_id === activeFilterId;
    return false;
  });

  const handlePrint = () => {
    window.print();
  };

  const openAddModal = (day: string, time: string) => {
    if (!isAdmin) return;
    if (!activeFilterId || viewMode !== "SECTION") {
      toast.error("Please select a Section first to add a schedule.");
      return;
    }
    setSelectedDay(day);
    setSelectedTime(time);
    setIsAddModalOpen(true);
  };

  const handleCreateSlot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // Automatically attach active filter's academic context since we only allow creation in SECTION view
    const section = sections.find(s => s.id === activeFilterId);
    formData.append("section_id", section.id);
    formData.append("semester_id", section.semesters?.id);
    formData.append("academic_year_id", section.semesters?.academic_year_id);
    
    // Convert base time (e.g. 09:00) to start_time (09:00:00) and end_time (10:00:00)
    const baseTime = formData.get("time") as string;
    const hour = parseInt(baseTime.split(":")[0]);
    const endTimeStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    formData.append("start_time", baseTime);
    formData.append("end_time", endTimeStr);
    
    const result = await createTimetableSlot(formData);
    
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Schedule added successfully!");
      setIsAddModalOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteSlot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent modal opening
    if (!confirm("Are you sure you want to delete this class?")) return;
    
    const result = await deleteTimetableSlot(id);
    if (result?.error) toast.error(result.error);
    else toast.success("Deleted successfully");
  };

  const getSlot = (day: string, time: string) => {
    // Basic formatting match (e.g. 09:00:00 matches 09:00)
    return filteredSlots.find(s => s.day_of_week === day && s.start_time.startsWith(time));
  };

  const activeTitle = activeFilterId ? 
    viewMode === "SECTION" ? sections.find(s => s.id === activeFilterId)?.name :
    viewMode === "FACULTY" ? faculty.find(f => f.id === activeFilterId)?.profiles?.first_name :
    rooms.find(r => r.id === activeFilterId)?.room_number 
    : "Select to view";

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="print:hidden">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1">
            <Label>View By</Label>
            <Select value={viewMode} onValueChange={(v: any) => { setViewMode(v); setActiveFilterId(""); }}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="SECTION">Section</SelectItem>
                <SelectItem value="FACULTY">Faculty</SelectItem>
                <SelectItem value="ROOM">Room</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 flex-[2]">
            <Label>Select {viewMode.charAt(0) + viewMode.slice(1).toLowerCase()}</Label>
            <Select value={activeFilterId} onValueChange={(val) => setActiveFilterId(val || "")}>
              <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
              <SelectContent>
                {viewMode === "SECTION" && sections.map(s => <SelectItem key={s.id} value={s.id}>{s.courses?.name} - {s.name}</SelectItem>)}
                {viewMode === "FACULTY" && faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.profiles?.first_name} {f.profiles?.last_name}</SelectItem>)}
                {viewMode === "ROOM" && rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.room_number}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={handlePrint} disabled={!activeFilterId}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      {activeFilterId ? (
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="print:py-2">
            <CardTitle className="text-center text-2xl print:text-xl">
              Timetable: {activeTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted/50 w-24">Time</th>
                  {DAYS.map(day => (
                    <th key={day} className="border p-2 bg-muted/50 text-center">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMES.map(time => (
                  <tr key={time}>
                    <td className="border p-2 text-center font-medium bg-muted/10">
                      {time}
                    </td>
                    {DAYS.map(day => {
                      const slot = getSlot(day, time);
                      return (
                        <td 
                          key={`${day}-${time}`} 
                          className={`border p-2 min-h-[80px] align-top transition-colors ${isAdmin && viewMode === "SECTION" && !slot ? 'hover:bg-primary/5 cursor-pointer' : ''}`}
                          onClick={() => !slot && openAddModal(day, time)}
                        >
                          {slot ? (
                            <div className="relative bg-primary/10 border-l-4 border-primary p-2 rounded flex flex-col gap-1 h-full print:border print:border-black print:bg-white">
                              <span className="font-bold">{slot.subjects?.name}</span>
                              {viewMode !== "FACULTY" && (
                                <span className="text-xs flex items-center text-muted-foreground"><User className="w-3 h-3 mr-1"/> {slot.faculty?.profiles?.first_name}</span>
                              )}
                              {viewMode !== "ROOM" && (
                                <span className="text-xs flex items-center text-muted-foreground"><MapPin className="w-3 h-3 mr-1"/> {slot.rooms?.room_number}</span>
                              )}
                              {viewMode !== "SECTION" && (
                                <span className="text-xs flex items-center text-muted-foreground"><Users className="w-3 h-3 mr-1"/> {slot.sections?.name}</span>
                              )}
                              {isAdmin && (
                                <button onClick={(e) => handleDeleteSlot(slot.id, e)} className="absolute top-1 right-1 opacity-0 hover:opacity-100 transition-opacity p-1 text-red-500 print:hidden">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center p-12 text-muted-foreground border rounded-lg bg-muted/20 print:hidden">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select an entity above to view its timetable.</p>
        </div>
      )}

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Class Schedule</DialogTitle>
            <DialogDescription>
              {selectedDay} at {selectedTime} for {activeTitle}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSlot}>
            <input type="hidden" name="day_of_week" value={selectedDay} />
            <input type="hidden" name="time" value={selectedTime} />
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select name="subject_id" required>
                  <SelectTrigger><SelectValue placeholder="Select subject..."/></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.subject_code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Faculty</Label>
                <Select name="faculty_id" required>
                  <SelectTrigger><SelectValue placeholder="Assign faculty..."/></SelectTrigger>
                  <SelectContent>
                    {faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.profiles?.first_name} {f.profiles?.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Room</Label>
                <Select name="room_id" required>
                  <SelectTrigger><SelectValue placeholder="Assign room..."/></SelectTrigger>
                  <SelectContent>
                    {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.room_number}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Schedule"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

const Users = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
)
