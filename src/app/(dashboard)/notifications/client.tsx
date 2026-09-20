/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { markNotificationRead, markAllNotificationsRead, deleteNotification } from "../assignments/actions";
import {
  Bell,
  CheckCircle,
  CheckCheck,
  Trash2,
  FileText,
  AlertCircle,
  CreditCard,
  BookOpen,
  Home,
  Bus,
  GraduationCap,
  Info,
  Megaphone,
} from "lucide-react";
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

const categoryIcons: Record<string, any> = {
  SYSTEM: Info,
  ASSIGNMENT: FileText,
  NOTICE: Megaphone,
  FEE: CreditCard,
  ATTENDANCE: CheckCircle,
  LIBRARY: BookOpen,
  HOSTEL: Home,
  TRANSPORT: Bus,
  EXAM: GraduationCap,
};

const categoryColors: Record<string, string> = {
  SYSTEM: "bg-blue-100 text-blue-700",
  ASSIGNMENT: "bg-indigo-100 text-indigo-700",
  NOTICE: "bg-orange-100 text-orange-700",
  FEE: "bg-red-100 text-red-700",
  ATTENDANCE: "bg-green-100 text-green-700",
  LIBRARY: "bg-purple-100 text-purple-700",
  HOSTEL: "bg-cyan-100 text-cyan-700",
  TRANSPORT: "bg-yellow-100 text-yellow-700",
  EXAM: "bg-pink-100 text-pink-700",
};

export function NotificationsClient({
  notifications,
  userId,
}: {
  notifications: any[];
  userId: string;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id: string) => {
    const result = await markNotificationRead(id);
    if (result?.error) {
      toast.error(result.error);
    }
  };

  const handleMarkAllRead = async () => {
    setIsProcessing(true);
    const result = await markAllNotificationsRead();
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("All notifications marked as read");
    }
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteNotification(deleteId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Notification deleted");
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {notifications.length > 0 && unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={isProcessing}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No notifications</p>
              <p className="text-sm">You&apos;re all caught up!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = categoryIcons[n.category] || Bell;
            const colorClass = categoryColors[n.category] || "bg-gray-100 text-gray-700";

            return (
              <Card
                key={n.id}
                className={`transition-colors ${!n.is_read ? "bg-blue-50/50 border-blue-200" : ""}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 p-2 rounded-full ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-sm font-medium ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                          {n.title}
                        </h4>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">{formatTime(n.created_at)}</span>
                        {n.link && (
                          <a href={n.link} className="text-xs text-blue-600 hover:underline">
                            View Details
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkRead(n.id)}
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setDeleteId(n.id); setDeleteOpen(true); }}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification?
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
