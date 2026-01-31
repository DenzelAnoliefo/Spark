"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  getReferral,
  getTasks,
  updateReferralStatus,
  updateTask,
  createAppointment,
  updateAppointment,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { NoShowBanner } from "@/components/shared/no-show-banner";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ArrowLeft, Calendar, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { REFERRAL_STATUSES } from "@/lib/mockData";
import { AddAppointmentSheet } from "@/components/nurse/add-appointment-sheet";

export default function ReferralDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { mockMode } = useAuth();
  const [referral, setReferral] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusChanging, setStatusChanging] = useState(false);
  const [appointmentSheetOpen, setAppointmentSheetOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ref, t] = await Promise.all([
          getReferral(params.id, mockMode),
          getTasks("open", mockMode),
        ]);
        setReferral(ref);
        setTasks((t || []).filter((x) => x.referral_id === params.id));
      } catch (err) {
        toast.error("Failed to load referral");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, mockMode]);

  const handleStatusChange = async (newStatus) => {
    setStatusChanging(true);
    try {
      await updateReferralStatus(params.id, newStatus, mockMode);
      setReferral((r) => (r ? { ...r, status: newStatus } : null));
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setStatusChanging(false);
    }
  };

  const handleTaskDone = async (taskId) => {
    try {
      await updateTask(taskId, { status: "DONE" }, mockMode);
      setTasks((t) => t.filter((x) => x.id !== taskId));
      toast.success("Task marked done");
    } catch (err) {
      toast.error(err.message || "Failed to update task");
    }
  };

  const handleAppointmentAdded = (apt) => {
    setReferral((r) =>
      r
        ? {
            ...r,
            appointments: [...(r.appointments || []), apt],
            status: "BOOKED",
          }
        : null
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner className="h-10 w-10" />
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Referral not found</p>
        <Link href="/nurse">
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const timeline = referral.timeline || [];
  const appointments = referral.appointments || [];

  return (
    <div className="space-y-6">
      <Link href="/nurse" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Link>

      <NoShowBanner referral={referral} />

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{referral.patient_name}</h1>
          <p className="text-muted-foreground">{referral.specialty}</p>
          <div className="flex gap-2 mt-2">
            <StatusBadge status={referral.status} />
            <PriorityBadge priority={referral.priority} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select
            value={referral.status}
            onValueChange={handleStatusChange}
            disabled={statusChanging}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REFERRAL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet</p>
            ) : (
              <ul className="space-y-3">
                {[...timeline].reverse().map((e) => (
                  <li key={e.id} className="flex gap-3 text-sm">
                    <span className="text-muted-foreground shrink-0">
                      {new Date(e.timestamp).toLocaleString()}
                    </span>
                    <span>{e.description || e.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Appointments
              </CardTitle>
              <Button size="sm" onClick={() => setAppointmentSheetOpen(true)}>
                Add / Update
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments yet</p>
            ) : (
              <ul className="space-y-4">
                {appointments.map((apt) => (
                  <li key={apt.id} className="border rounded-lg p-4">
                    <p className="font-medium">
                      {new Date(apt.scheduled_for).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{apt.location}</p>
                    <StatusBadge status={apt.status} className="mt-2" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reschedule Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div>
                    <p className="font-medium">{t.type}</p>
                    <p className="text-sm text-muted-foreground">
                      Due {new Date(t.due_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleTaskDone(t.id)}
                    className="gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark done
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{referral.notes || "No notes"}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Due: {referral.due_date ? new Date(referral.due_date).toLocaleDateString() : "—"}
            {referral.transportation_needed && " • Transportation needed"}
          </p>
        </CardContent>
      </Card>

      <AddAppointmentSheet
        open={appointmentSheetOpen}
        onOpenChange={setAppointmentSheetOpen}
        referralId={params.id}
        onSuccess={handleAppointmentAdded}
        mockMode={mockMode}
      />
    </div>
  );
}
