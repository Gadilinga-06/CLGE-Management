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
import { toast } from "sonner";
import { createBus, updateBus, deleteBus, createDriver, updateDriver, deleteDriver, createRoute, updateRoute, deleteRoute, createStop, deleteStop } from "./actions";
import { Bus, Route, User, MapPin, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export function TransportDashboardClient({ stats, recentAssignments, routes }: {
  stats: { totalBuses: number; activeBuses: number; totalDrivers: number; totalRoutes: number; totalStudents: number };
  recentAssignments: any[];
  routes: any[];
}) {
  const [addBusDialog, setAddBusDialog] = useState(false);
  const [editBus, setEditBus] = useState<any>(null);
  const [addDriverDialog, setAddDriverDialog] = useState(false);
  const [editDriver, setEditDriver] = useState<any>(null);
  const [addRouteDialog, setAddRouteDialog] = useState(false);
  const [editRoute, setEditRoute] = useState<any>(null);
  const [addStopDialog, setAddStopDialog] = useState<string | null>(null); // route_id
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bus handlers
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

  // Driver handlers
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

  // Route handlers
  const handleAddRoute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createRoute(new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Route created!"); setAddRouteDialog(false); }
    setIsSubmitting(false);
  };

  const handleEditRoute = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!editRoute) return;
    e.preventDefault();
    setIsSubmitting(true);
    const result = await updateRoute(editRoute.id, new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Route updated!"); setEditRoute(null); }
    setIsSubmitting(false);
  };

  const handleAddStop = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createStop(new FormData(e.currentTarget));
    if (result?.error) toast.error(result.error);
    else { toast.success("Stop added!"); setAddStopDialog(null); }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Buses", value: stats.totalBuses, icon: <Bus className="w-4 h-4" />, color: "text-primary" },
          { label: "Active Buses", value: stats.activeBuses, icon: <Bus className="w-4 h-4" />, color: "text-green-600" },
          { label: "Drivers", value: stats.totalDrivers, icon: <User className="w-4 h-4" />, color: "text-blue-600" },
          { label: "Routes", value: stats.totalRoutes, icon: <Route className="w-4 h-4" />, color: "text-purple-600" },
          { label: "Students", value: stats.totalStudents, icon: <Users className="w-4 h-4" />, color: "text-orange-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-1">
                <span className={s.color}>{s.icon}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
              </div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: "/transport/assignments", label: "Assignments", desc: "Assign students to routes and stops", icon: <Users className="w-5 h-5" /> },
          { href: "/transport/routes", label: "Routes & Stops", desc: "Manage routes, stops, and timings", icon: <MapPin className="w-5 h-5" /> },
          { href: "/transport/buses", label: "Buses & Drivers", desc: "Manage fleet and driver profiles", icon: <Bus className="w-5 h-5" /> },
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

      {/* Routes Overview */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Routes ({routes.length})</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddBusDialog(true)}>+ Bus</Button>
          <Button variant="outline" onClick={() => setAddDriverDialog(true)}>+ Driver</Button>
          <Button onClick={() => setAddRouteDialog(true)}>+ Route</Button>
        </div>
      </div>

      {routes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Route className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No routes configured. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {routes.map((route: any) => {
            const assignedCount = recentAssignments.filter((a: any) => a.routes?.name === route.name).length;
            const stops = (route.bus_stops || []).sort((a: any, b: any) => a.stop_order - b.stop_order);
            return (
              <Card key={route.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {route.name}
                        <Badge variant="outline">{assignedCount} students</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {route.start_point || "?"} → {route.end_point || "?"} • {stops.length} stops
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bus: {route.buses?.registration_number || "Not assigned"} ({route.buses?.capacity || "?"} seats) • Driver: {route.drivers?.name || "Not assigned"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditRoute(route)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => setAddStopDialog(route.id)}>+ Stop</Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteRoute(route.id).then(r => r?.error ? toast.error(r.error) : toast.success("Deleted"))}>Delete</Button>
                    </div>
                  </div>
                </CardHeader>
                {stops.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {stops.map((stop: any) => (
                        <div key={stop.id} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-1.5 text-xs">
                          <span className="font-medium">{stop.name}</span>
                          <span className="text-muted-foreground">↑{stop.pickup_time} ↓{stop.drop_time}</span>
                          <button
                            className="text-red-400 hover:text-red-600 ml-1"
                            onClick={() => deleteStop(stop.id).then(r => r?.error ? toast.error(r.error) : toast.success("Removed"))}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Stop</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAssignments.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.students?.profiles?.first_name} {a.students?.profiles?.last_name}</TableCell>
                  <TableCell>{a.routes?.name}</TableCell>
                  <TableCell>{a.bus_stops?.name}</TableCell>
                  <TableCell className="text-sm">{a.bus_stops?.pickup_time}</TableCell>
                  <TableCell><Badge variant={a.status === "ACTIVE" ? "default" : "secondary"} className={a.status === "ACTIVE" ? "bg-green-500" : ""}>{a.status}</Badge></TableCell>
                </TableRow>
              ))}
              {recentAssignments.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No assignments yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Bus Dialog */}
      <Dialog open={addBusDialog} onOpenChange={setAddBusDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Bus</DialogTitle></DialogHeader>
          <form onSubmit={handleAddBus}>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Registration Number *</Label><Input name="registration_number" required placeholder="e.g. MH-12-AB-1234" /></div>
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

      {/* Add Route Dialog */}
      <Dialog open={addRouteDialog} onOpenChange={setAddRouteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Route</DialogTitle></DialogHeader>
          <form onSubmit={handleAddRoute}>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Route Name *</Label><Input name="name" required placeholder="e.g. City Center - College" /></div>
              <div className="space-y-2"><Label>Start Point</Label><Input name="start_point" placeholder="e.g. Main Bus Stand" /></div>
              <div className="space-y-2"><Label>End Point</Label><Input name="end_point" placeholder="e.g. College Gate" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddRouteDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Create Route</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Route Dialog */}
      <Dialog open={!!editRoute} onOpenChange={open => !open && setEditRoute(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Route</DialogTitle></DialogHeader>
          <form onSubmit={handleEditRoute}>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Route Name *</Label><Input name="name" required defaultValue={editRoute?.name} /></div>
              <div className="space-y-2"><Label>Start Point</Label><Input name="start_point" defaultValue={editRoute?.start_point || ""} /></div>
              <div className="space-y-2"><Label>End Point</Label><Input name="end_point" defaultValue={editRoute?.end_point || ""} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditRoute(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Stop Dialog */}
      <Dialog open={!!addStopDialog} onOpenChange={open => !open && setAddStopDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Stop</DialogTitle></DialogHeader>
          <form onSubmit={handleAddStop}>
            <div className="space-y-4 py-4">
              <input type="hidden" name="route_id" value={addStopDialog || ""} />
              <div className="space-y-2"><Label>Stop Name *</Label><Input name="name" required placeholder="e.g. Main Market" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Pickup Time *</Label><Input name="pickup_time" type="time" required /></div>
                <div className="space-y-2"><Label>Drop Time *</Label><Input name="drop_time" type="time" required /></div>
              </div>
              <div className="space-y-2"><Label>Stop Order</Label><Input name="stop_order" type="number" min="1" defaultValue="1" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddStopDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Add Stop</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
