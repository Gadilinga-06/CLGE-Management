/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createHostel, updateHostel, deleteHostel, createBlock, updateBlock, deleteBlock, createRoom, updateRoom } from "./actions";
import { Building2, BedDouble, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export function HostelDashboardClient({ hostels, stats, wardenProfiles }: {
  hostels: any[];
  stats: { totalBeds: number; occupiedBeds: number; availableBeds: number; occupancyPct: number };
  wardenProfiles: any[];
}) {
  const [addHostelDialog, setAddHostelDialog] = useState(false);
  const [editHostel, setEditHostel] = useState<any>(null);
  const [addBlockDialog, setAddBlockDialog] = useState<string | null>(null);
  const [editBlock, setEditBlock] = useState<any>(null);
  const [addRoomDialog, setAddRoomDialog] = useState<string | null>(null);
  const [editRoom, setEditRoom] = useState<any>(null);
  const [expandedHostel, setExpandedHostel] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddHostel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createHostel(new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Hostel created!"); setAddHostelDialog(false); }
    setIsSubmitting(false);
  };

  const handleEditHostel = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!editHostel) return;
    e.preventDefault();
    setIsSubmitting(true);
    const result = await updateHostel(editHostel.id, new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Hostel updated!"); setEditHostel(null); }
    setIsSubmitting(false);
  };

  const handleAddBlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createBlock(new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Block added!"); setAddBlockDialog(null); }
    setIsSubmitting(false);
  };

  const handleEditBlock = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!editBlock) return;
    e.preventDefault();
    setIsSubmitting(true);
    const result = await updateBlock(editBlock.id, new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Block updated!"); setEditBlock(null); }
    setIsSubmitting(false);
  };

  const handleAddRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createRoom(new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Room added with beds!"); setAddRoomDialog(null); }
    setIsSubmitting(false);
  };

  const handleEditRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!editRoom) return;
    e.preventDefault();
    setIsSubmitting(true);
    const result = await updateRoom(editRoom.id, new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Room updated!"); setEditRoom(null); }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Beds", value: stats.totalBeds, color: "text-primary" },
          { label: "Occupied", value: stats.occupiedBeds, color: "text-red-600" },
          { label: "Available", value: stats.availableBeds, color: "text-green-600" },
          { label: "Occupancy", value: `${stats.occupancyPct}%`, color: stats.occupancyPct > 85 ? "text-red-600" : "text-primary" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Occupancy Bar */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Occupancy</span>
            <span className="text-sm font-bold">{stats.occupancyPct}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${stats.occupancyPct > 85 ? "bg-red-500" : stats.occupancyPct > 60 ? "bg-yellow-500" : "bg-green-500"}`}
              style={{ width: `${stats.occupancyPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{stats.occupiedBeds} occupied</span>
            <span>{stats.availableBeds} available</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: "/hostel/allocations", label: "Allocations", desc: "Assign, transfer, and vacate beds", icon: <BedDouble className="w-5 h-5" /> },
          { href: "/hostel/complaints", label: "Complaints", desc: "View and resolve hostel complaints", icon: <Building2 className="w-5 h-5" /> },
          { href: "/hostel/visitors", label: "Visitors", desc: "Log and manage visitor entries", icon: <Users className="w-5 h-5" /> },
        ].map(item => (
          <Card key={item.href} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-md bg-primary/10 text-primary">{item.icon}</div>
                <h3 className="font-semibold">{item.label}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
              <Link href={item.href} className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                Open <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hostels List */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Hostel Structure</h3>
        <Button onClick={() => setAddHostelDialog(true)}>+ Add Hostel</Button>
      </div>

      {hostels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No hostels configured. Add one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        hostels.map((hostel: any) => {
          const hBeds = hostel.hostel_blocks?.flatMap((b: any) => b.hostel_rooms?.flatMap((r: any) => r.hostel_beds || []) || []) || [];
          const hOccupied = hBeds.filter((b: any) => b.status === "OCCUPIED").length;

          return (
            <Card key={hostel.id} className="border-l-4" style={{ borderLeftColor: hostel.type === "BOYS" ? "#3b82f6" : "#ec4899" }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {hostel.name}
                      <Badge variant="outline">{hostel.type}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hostel.total_floors} floor(s) • Warden: {hostel.profiles?.first_name || "Not assigned"} {hostel.profiles?.last_name || ""}
                    </p>
                    {hostel.description && <p className="text-sm text-muted-foreground">{hostel.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xl font-bold">{hOccupied}/{hBeds.length}</div>
                      <div className="text-xs text-muted-foreground">beds</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setExpandedHostel(expandedHostel === hostel.id ? null : hostel.id)}>
                      {expandedHostel === hostel.id ? "Collapse" : "Expand"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditHostel(hostel)}>Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => setAddBlockDialog(hostel.id)}>+ Block</Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteHostel(hostel.id).then(r => r?.error ? toast.error(r.error) : toast.success("Deleted"))}>Delete</Button>
                  </div>
                </div>
              </CardHeader>

              {expandedHostel === hostel.id && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {(hostel.hostel_blocks || []).map((block: any) => {
                      const bBeds = block.hostel_rooms?.flatMap((r: any) => r.hostel_beds || []) || [];
                      const bOccupied = bBeds.filter((b: any) => b.status === "OCCUPIED").length;
                      return (
                        <div key={block.id} className="border rounded-md p-3 bg-muted/20">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{block.name} <span className="text-xs text-muted-foreground">Floor {block.floor_number}</span></div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{bOccupied}/{bBeds.length} beds</span>
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditBlock(block)}>Edit</Button>
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAddRoomDialog(block.id)}>+ Room</Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => deleteBlock(block.id).then(r => r?.error ? toast.error(r.error) : toast.success("Deleted"))}>Del</Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {(block.hostel_rooms || []).map((room: any) => {
                              const avail = (room.hostel_beds || []).filter((b: any) => b.status === "AVAILABLE").length;
                              const occ = (room.hostel_beds || []).filter((b: any) => b.status === "OCCUPIED").length;
                              return (
                                <div key={room.id} className="bg-background border rounded p-2 text-center text-xs cursor-pointer hover:shadow-sm" onClick={() => setEditRoom(room)}>
                                  <div className="font-semibold">Room {room.room_number}</div>
                                  <div className="text-muted-foreground">{room.room_type}</div>
                                  <div className="flex justify-center gap-1 mt-1">
                                    <span className="text-green-600">{avail}✓</span>
                                    <span className="text-red-500">{occ}✗</span>
                                  </div>
                                  {room.monthly_rent > 0 && <div className="text-muted-foreground">₹{room.monthly_rent}/mo</div>}
                                </div>
                              );
                            })}
                            {(block.hostel_rooms || []).length === 0 && (
                              <div className="text-xs text-muted-foreground col-span-4 py-2">No rooms yet. Add one.</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(hostel.hostel_blocks || []).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No blocks yet. Add a block first.</p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })
      )}

      {/* Add Hostel Dialog */}
      <Dialog open={addHostelDialog} onOpenChange={setAddHostelDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Hostel</DialogTitle></DialogHeader>
          <form onSubmit={handleAddHostel}>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Hostel Name *</Label><Input name="name" required placeholder="e.g. Krishna Boys Hostel" /></div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select name="type" required>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOYS">Boys</SelectItem>
                    <SelectItem value="GIRLS">Girls</SelectItem>
                    <SelectItem value="MIXED">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Total Floors</Label><Input name="total_floors" type="number" min="1" defaultValue="1" /></div>
              <div className="space-y-2">
                <Label>Warden</Label>
                <Select name="warden_id">
                  <SelectTrigger><SelectValue placeholder="Assign warden (optional)" /></SelectTrigger>
                  <SelectContent>
                    {wardenProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Description</Label><Input name="description" placeholder="Optional notes..." /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddHostelDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Create Hostel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Hostel Dialog */}
      <Dialog open={!!editHostel} onOpenChange={open => !open && setEditHostel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Hostel</DialogTitle></DialogHeader>
          <form onSubmit={handleEditHostel}>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Hostel Name *</Label><Input name="name" required defaultValue={editHostel?.name} /></div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select name="type" required defaultValue={editHostel?.type}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOYS">Boys</SelectItem>
                    <SelectItem value="GIRLS">Girls</SelectItem>
                    <SelectItem value="MIXED">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Total Floors</Label><Input name="total_floors" type="number" min="1" defaultValue={editHostel?.total_floors || 1} /></div>
              <div className="space-y-2">
                <Label>Warden</Label>
                <Select name="warden_id" defaultValue={editHostel?.warden_id || ""}>
                  <SelectTrigger><SelectValue placeholder="Assign warden (optional)" /></SelectTrigger>
                  <SelectContent>
                    {wardenProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Description</Label><Input name="description" defaultValue={editHostel?.description || ""} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditHostel(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Block Dialog */}
      <Dialog open={!!addBlockDialog} onOpenChange={open => !open && setAddBlockDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Block</DialogTitle></DialogHeader>
          <form onSubmit={handleAddBlock}>
            <div className="space-y-4 py-4">
              <input type="hidden" name="hostel_id" value={addBlockDialog || ""} />
              <div className="space-y-2"><Label>Block Name *</Label><Input name="name" required placeholder="e.g. Block A" /></div>
              <div className="space-y-2"><Label>Floor Number</Label><Input name="floor_number" type="number" min="1" defaultValue="1" /></div>
              <div className="space-y-2"><Label>Description</Label><Input name="description" placeholder="Optional..." /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddBlockDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Add Block</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Block Dialog */}
      <Dialog open={!!editBlock} onOpenChange={open => !open && setEditBlock(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Block</DialogTitle></DialogHeader>
          <form onSubmit={handleEditBlock}>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Block Name *</Label><Input name="name" required defaultValue={editBlock?.name} /></div>
              <div className="space-y-2"><Label>Floor Number</Label><Input name="floor_number" type="number" min="1" defaultValue={editBlock?.floor_number || 1} /></div>
              <div className="space-y-2"><Label>Description</Label><Input name="description" defaultValue={editBlock?.description || ""} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditBlock(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={!!addRoomDialog} onOpenChange={open => !open && setAddRoomDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
          <form onSubmit={handleAddRoom}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <input type="hidden" name="block_id" value={addRoomDialog || ""} />
              <div className="space-y-2"><Label>Room Number *</Label><Input name="room_number" required placeholder="e.g. 101" /></div>
              <div className="space-y-2"><Label>Capacity (Beds) *</Label><Input name="capacity" type="number" min="1" max="10" defaultValue="2" required /></div>
              <div className="space-y-2">
                <Label>Room Type</Label>
                <Select name="room_type" defaultValue="SHARED">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHARED">Shared</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="SUITE">Suite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Monthly Rent (₹)</Label><Input name="monthly_rent" type="number" step="0.01" defaultValue="0" /></div>
              <div className="flex items-center gap-2 col-span-2">
                <input type="checkbox" name="has_ac" value="true" id="has_ac_add" />
                <Label htmlFor="has_ac_add">Air Conditioned</Label>
                <input type="checkbox" name="has_attached_bath" value="true" id="has_bath_add" className="ml-4" />
                <Label htmlFor="has_bath_add">Attached Bathroom</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddRoomDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Add Room & Beds</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={!!editRoom} onOpenChange={open => !open && setEditRoom(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Room {editRoom?.room_number}</DialogTitle></DialogHeader>
          <form onSubmit={handleEditRoom}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2"><Label>Room Number *</Label><Input name="room_number" required defaultValue={editRoom?.room_number} /></div>
              <div className="space-y-2">
                <Label>Room Type</Label>
                <Select name="room_type" defaultValue={editRoom?.room_type || "SHARED"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHARED">Shared</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="SUITE">Suite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Monthly Rent (₹)</Label><Input name="monthly_rent" type="number" step="0.01" defaultValue={editRoom?.monthly_rent || 0} /></div>
              <div className="flex items-center gap-2 col-span-2">
                <input type="checkbox" name="has_ac" value="true" id="has_ac_edit" defaultChecked={editRoom?.has_ac || false} />
                <Label htmlFor="has_ac_edit">Air Conditioned</Label>
                <input type="checkbox" name="has_attached_bath" value="true" id="has_bath_edit" className="ml-4" defaultChecked={editRoom?.has_attached_bath || false} />
                <Label htmlFor="has_bath_edit">Attached Bathroom</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditRoom(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
