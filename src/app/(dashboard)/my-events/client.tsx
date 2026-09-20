/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { registerForEvent, cancelRegistration } from "../events/actions";
import { Calendar, MapPin, Users, Plus, XCircle, CheckCircle, Clock } from "lucide-react";

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

const regStatusColors: Record<string, string> = {
  REGISTERED: "bg-green-100 text-green-800 border-green-200",
  ATTENDED: "bg-blue-100 text-blue-800 border-blue-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

export function MyEventsClient({
  events,
  myRegistrations,
}: {
  events: any[];
  myRegistrations: any[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (eventId: string) => {
    setIsSubmitting(true);
    const result = await registerForEvent(eventId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Registered successfully");
    }
    setIsSubmitting(false);
  };

  const handleCancel = async (eventId: string) => {
    setIsSubmitting(true);
    const result = await cancelRegistration(eventId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Registration cancelled");
    }
    setIsSubmitting(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const registeredEventIds = new Set(
    myRegistrations.filter((r) => r.status === "REGISTERED").map((r) => r.event_id)
  );

  const registeredEvents = events.filter((e) => registeredEventIds.has(e.id));
  const availableEvents = events.filter((e) => !registeredEventIds.has(e.id) && e.status !== "CANCELLED");

  return (
    <div className="space-y-8">
      {/* My Registrations */}
      <div>
        <h3 className="text-lg font-semibold mb-4">My Registrations</h3>
        {registeredEvents.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>You haven&apos;t registered for any events yet.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {registeredEvents.map((event) => {
              const reg = myRegistrations.find((r) => r.event_id === event.id && r.status === "REGISTERED");
              return (
                <Card key={event.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${categoryColors[event.category] || categoryColors.GENERAL}`}>
                        {event.category}
                      </span>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${regStatusColors.REGISTERED}`}>
                        REGISTERED
                      </span>
                    </div>
                    <CardTitle className="text-lg mt-2">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {event.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{event.venue}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
                      </div>
                      {event.capacity && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Capacity: {event.capacity}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full"
                        disabled={isSubmitting}
                        onClick={() => handleCancel(event.id)}
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Cancel Registration
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Events */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Events</h3>
        {availableEvents.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No events available for registration.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableEvents.map((event) => {
              const isFull = event.capacity ? false : false;
              return (
                <Card key={event.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${categoryColors[event.category] || categoryColors.GENERAL}`}>
                        {event.category}
                      </span>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColors[event.status] || statusColors.UPCOMING}`}>
                        {event.status}
                      </span>
                    </div>
                    <CardTitle className="text-lg mt-2">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {event.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{event.venue}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
                      </div>
                      {event.capacity && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Capacity: {event.capacity}</span>
                        </div>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                    )}
                    <div className="mt-4">
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={isFull || event.status === "COMPLETED" || isSubmitting}
                        onClick={() => handleRegister(event.id)}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Register
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
