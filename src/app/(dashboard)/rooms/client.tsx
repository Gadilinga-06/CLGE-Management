"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoom, updateRoom, deleteRoom } from "./actions";
import { toast } from "sonner";
import { Database } from "@/types/database";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Room = Database["public"]["Tables"]["rooms"]["Row"];

export function RoomsClient({ 
  data, 
  canManage 
}: { 
  data: Room[];
  canManage: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = data.filter((d) => 
    d.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.building && d.building.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenModal = (room?: Room) => {
    setSelectedRoom(room || null);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    let result;
    if (selectedRoom) {
      result = await updateRoom(selectedRoom.id, formData);
    } else {
      result = await createRoom(formData);
    }

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Room ${selectedRoom ? "updated" : "created"} successfully.`);
      setIsModalOpen(false);
    }
    setIsLoading(false);
  };

  const onDelete = async () => {
    if (!selectedRoom) return;
    setIsLoading(true);
    const result = await deleteRoom(selectedRoom.id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Room deleted successfully.");
      setIsDeleteDialogOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <div>
      {canManage && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" /> Add Room
          </Button>
        </div>
      )}

      <DataTable
        columns={[
          { header: "Room Number", accessor: "room_number" },
          { header: "Building", accessor: (row) => row.building || "Main" },
          { header: "Capacity", accessor: "capacity" },
          { header: "Type", accessor: "room_type" },
          { header: "Status", accessor: (row) => (
            row.status === "AVAILABLE" ? <Badge variant="outline" className="bg-green-100 text-green-800">Available</Badge> :
            row.status === "MAINTENANCE" ? <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Maintenance</Badge> :
            <Badge variant="outline">{row.status}</Badge>
          ) },
          { 
            header: "Actions", 
            accessor: (row) => (
              <div className="flex items-center gap-2">
                {canManage && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(row)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(row)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            )
          }
        ]}
        data={filteredData}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search rooms..."
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRoom ? "Edit Room" : "Add Room"}</DialogTitle>
            <DialogDescription>
              {selectedRoom ? "Update room details." : "Enter details for the new room."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room_number">Room Number</Label>
                  <Input id="room_number" name="room_number" defaultValue={selectedRoom?.room_number} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="building">Building</Label>
                  <Input id="building" name="building" defaultValue={selectedRoom?.building || ""} disabled={isLoading} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" name="capacity" type="number" min="1" defaultValue={selectedRoom?.capacity} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room_type">Room Type</Label>
                  <Select name="room_type" defaultValue={selectedRoom?.room_type || "LECTURE_HALL"} required disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LECTURE_HALL">Lecture Hall</SelectItem>
                      <SelectItem value="CLASSROOM">Classroom</SelectItem>
                      <SelectItem value="LABORATORY">Laboratory</SelectItem>
                      <SelectItem value="SEMINAR_HALL">Seminar Hall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={selectedRoom?.status || "AVAILABLE"} required disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="OCCUPIED">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the room.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
              e.preventDefault();
              onDelete();
            }} className="bg-red-500 hover:bg-red-600" disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
