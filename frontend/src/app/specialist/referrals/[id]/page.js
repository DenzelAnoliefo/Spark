"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getReferral, createAppointment, updateAppointment, rescheduleAppointment, triggerNoShowEmail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ArrowLeft, Calendar } from "lucide-react";
import { toast } from "sonner";
import { SpecialistAppointmentSheet } from "@/components/specialist/appointment-sheet";

export default function SpecialistReferralDetailPage() {
  const params = useParams();
  const { mockMode, user } = useAuth();
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    getReferral(params.id, mockMode)
      .then(setReferral)
      .catch(() => setReferral(null))
      .finally(() => setLoading(false));
  }, [params.id, mockMode]);

  const loadReferral = () =>
    getReferral(params.id, mockMode).then(setReferral).catch(() => setReferral(null));

  const handleAppointmentUpdate = async (referralId, aptId, data) => {
    const isNoShow = !mockMode && data?.status === "NO_SHOW";

    if (aptId) {
      await updateAppointment(aptId, data, mockMode);

      if (isNoShow) {
        await triggerNoShowEmail(referralId, mockMode);
      }
    } else {
      const apt = await createAppointment(referralId, data, mockMode, {
        specialistName: user?.full_name,
      });

      // ✅ NEW: if they created an appointment that is already NO_SHOW
      if (isNoShow) {
        await triggerNoShowEmail(referralId, mockMode);
      }

      setReferral((r) =>
        r
          ? { ...r, appointments: [...(r.appointments || []), apt], status: "BOOKED" }
          : null
      );
    }

    setSheetOpen(false);
  };

  const handleReschedule = async (referralId, appointmentId, data) => {
    try {
      await rescheduleAppointment(referralId, appointmentId, data, mockMode, {
        specialistName: user?.full_name,
      });
      toast.success("Appointment rescheduled");
      setSheetOpen(false);
      await loadReferral();
    } catch (err) {
      toast.error(err?.message ?? "Failed to reschedule");
    }
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
        <Link href="/specialist">
          <Button className="mt-4">Back</Button>
        </Link>
      </div>
    );
  }

  const appointments = referral.appointments || [];
  const timeline = referral.timeline || [];

  return (
    <div className="space-y-6">
      <Link href="/specialist" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{referral.patient_name}</h1>
          <p className="text-muted-foreground">{referral.specialty}</p>
          <div className="flex gap-2 mt-2">
            <StatusBadge status={referral.status} />
            <PriorityBadge priority={referral.priority} />
          </div>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Calendar className="h-4 w-4 mr-2" />
          Set / Update Appointment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appointments</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet</p>
          ) : (
            <ul className="space-y-3">
              {[...timeline].reverse().slice(0, 10).map((e) => (
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
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{referral.notes || "No notes"}</p>
        </CardContent>
      </Card>

      <SpecialistAppointmentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        referral={referral}
        onSuccess={handleAppointmentUpdate}
        onReschedule={handleReschedule}
        mockMode={mockMode}
      />
    </div>
  );
}
