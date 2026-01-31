"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getNotifications } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Bell } from "lucide-react";

export default function PatientNotificationsPage() {
  const { mockMode } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications("mine", mockMode).then(setNotifications).finally(() => setLoading(false));
  }, [mockMode]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="text-muted-foreground mt-1">Reminders and updates</p>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You don't have any notifications at this time."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium capitalize">{n.type?.replace(/_/g, " ")}</p>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(n.created_at).toLocaleString()} • {n.channel}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
