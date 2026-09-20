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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createBus, updateBus, deleteBus, createDriver, updateDriver, deleteDriver } from "../actions";
import { Bus, User } from "lucide-react";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  MAINTENANCE: "bg-yellow-100 text-yellow-800",
};

export function BusesClient({ buses, drivers }: { buses: any[]; drivers: any[] }) {
  const [addBusDialog, setAddBusDialog] = useState(false);
  const [editBus, setEditBus] = useState<any>(null);
  const [addDriverDialog, setAddDriverDialog] = useState(false);
  const [editDriver, setEditDriver] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddBus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createBus(new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Bus added!"); setAddBusDialog(false); }
    setIsSubmitting(false);
  };

  const handleEditBus = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!editBus) return;
    e.preventDefault();
    setIsSubmitting(true);
    const result = await updateBus(editBus.id, new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Bus updated!"); setEditBus(null); }
    setIsSubmitting(false);
  };

  const handleAddDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createDriver(new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Driver added!"); setAddDriverDialog(false); }
    setIsSubmitting(false);
  };

  const handleEditDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!editDriver) return;
    e.preventDefault();
    setIsSubmitting(true);
    const result = await updateDriver(editDriver.id, new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Driver updated!"); setEditDriver(null); }
    setIsSubmitting(false);
  };

  return (
    <Tabs defaultValue="buses">
      <TabsList>
        <TabsTrigger value="buses"><Bus className="w-4 h-4 mr-2" /> Buses ({buses.length})</TabsTrigger>
        <TabsTrigger value="drivers"><User className="w-4 h-4 mr-2" /> Drivers ({drivers.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="buses" className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setAddBusDialog(true)}>+ Add Bus</Button>
        </div>
        <Card>
          <CardContent className="pt-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-center">Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buses.map((bus: any) => (
                  <TableRow key={bus.id}>
                    <TableCell className="font-medium">{bus.registration_number}</TableCell>
                    <TableCell className="text-sm">{bus.model || "—"}</TableCell>
                    <TableCell className="text-center">{bus.capacity}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[bus.status] || ""}>{bus.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditBus(bus)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-500" onClick={() => deleteBus(bus.id).then(r => r?.error ? toast.error(r.error) : toast.success("Deleted"))}>Del</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {buses.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No buses found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="drivers" className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setAddDriverDialog(true)}>+ Add Driver</Button>
        </div>
        <Card>
          <CardContent className="pt-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-sm">{d.license_number}</TableCell>
                    <TableCell className="text-sm">{d.phone || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[d.status] || ""}>{d.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditDriver(d)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-500" onClick={() => deleteDriver(d.id).then(r => r?.error ? toast.error(r.error) : toast.success("Deleted"))}>Del</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {drivers.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No drivers found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Add Bus Dialog */}
      <Dialog open={addBusDialog} onOpenChange={setAddBusDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Bus</DialogTitle></DialogHeader>
          <form onSubmit={handleAddBus}>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Registration Number *</Label><Input name="registration_number" required placeholder="MH-12-AB-1234" /></div>
              <div className="space-y-2"><Label>Capacity *</Label><Input name="capacity" type="number" min="1" defaultValue="40" required /></div>
              <div className="space-y-2"><Label>Model</Label><Input name="model" placeholder="e.g. Tata 1613" /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue="ACTIVE">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="MAINTENANCE">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddBusDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Add Bus</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Bus Dialog */}
      <Dialog open={!!editBus} onOpenChange={open => !open && setEditBus(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Bus</DialogTitle></DialogHeader>
          <form onSubmit={handleEditBus}>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Registration Number *</Label><Input name="registration_number" required defaultValue={editBus?.registration_number} /></div>
              <div className="space-y-2"><Label>Capacity *</Label><Input name="capacity" type="number" min="1" defaultValue={editBus?.capacity} required /></div>
              <div className="space-y-2"><Label>Model</Label><Input name="model" defaultValue={editBus?.model || ""} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={editBus?.status || "ACTIVE"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="MAINTENANCE">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditBus(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Driver Dialog */}
      <Dialog open={addDriverDialog} onOpenChange={setAddDriverDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Driver</DialogTitle></DialogHeader>
          <form onSubmit={handleAddDriver}>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Full Name *</Label><Input name="name" required placeholder="Driver name" /></div>
              <div className="space-y-2"><Label>License Number *</Label><Input name="license_number" required placeholder="DL number" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input name="phone" placeholder="Contact number" /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue="ACTIVE">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDriverDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Add Driver</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={!!editDriver} onOpenChange={open => !open && setEditDriver(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Driver</DialogTitle></DialogHeader>
          <form onSubmit={handleEditDriver}>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Full Name *</Label><Input name="name" required defaultValue={editDriver?.name} /></div>
              <div className="space-y-2"><Label>License Number *</Label><Input name="license_number" required defaultValue={editDriver?.license_number} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input name="phone" defaultValue={editDriver?.phone || ""} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={editDriver?.status || "ACTIVE"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDriver(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
