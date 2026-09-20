/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bus, MapPin, User, Clock } from "lucide-react";

export function MyTransportClient({ assignment, allStops }: { assignment: any; allStops: any[] }) {
  if (!assignment) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bus className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">You do not have an active transport assignment.</p>
          <p className="text-sm text-muted-foreground mt-1">Contact the transport office to get assigned.</p>
        </CardContent>
      </Card>
    );
  }

  const route = assignment.routes;
  const myStop = assignment.bus_stops;

  return (
    <div className="space-y-6">
      {/* Assignment Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <Bus className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Route</span>
            </div>
            <div className="text-xl font-bold">{route?.name || "Not assigned"}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {route?.start_point || "?"} → {route?.end_point || "?"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Stop</span>
            </div>
            <div className="text-xl font-bold">{myStop?.name || "Not assigned"}</div>
            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
              <span>Pickup: {myStop?.pickup_time || "—"}</span>
              <span>Drop: {myStop?.drop_time || "—"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Driver</span>
            </div>
            <div className="text-xl font-bold">{route?.drivers?.name || "Not assigned"}</div>
            <p className="text-sm text-muted-foreground mt-1">{route?.drivers?.phone || "No phone"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bus Details */}
      {route?.buses && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="w-4 h-4" /> Bus Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground">Registration:</span> <span className="font-medium">{route.buses.registration_number}</span></div>
              <div><span className="text-muted-foreground">Model:</span> <span className="font-medium">{route.buses.model || "—"}</span></div>
              <div><span className="text-muted-foreground">Capacity:</span> <span className="font-medium">{route.buses.capacity} seats</span></div>
              <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Route Schedule */}
      {allStops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Route Schedule ({allStops.length} stops)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allStops.map((stop: any, idx: number) => (
                <div
                  key={stop.id}
                  className={`flex items-center gap-4 p-3 rounded-md text-sm ${stop.id === myStop?.id ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}
                >
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                  <span className="flex-1 font-medium">{stop.name} {stop.id === myStop?.id && <Badge variant="outline" className="ml-2 text-xs">Your Stop</Badge>}</span>
                  <span className="text-muted-foreground">↑ {stop.pickup_time}</span>
                  <span className="text-muted-foreground">↓ {stop.drop_time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
