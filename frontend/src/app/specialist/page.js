"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getReferrals, createAppointment, updateAppointment, rescheduleAppointment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText, Calendar, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { SpecialistAppointmentSheet } from "@/components/specialist/appointment-sheet";

export default function SpecialistPage() {
  const { mockMode, user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRef, setSelectedRef] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadReferrals = () =>
    getReferrals("mine", mockMode, { role: user?.role, userId: user?.id }).then(setReferrals);

  useEffect(() => {
    loadReferrals().finally(() => setLoading(false));
  }, [mockMode, user?.id, user?.role]);

  const needsBooking = referrals.filter((r) =>
    ["SENT", "NEEDS_RESCHEDULE", "BOOKED", "CONFIRMED"].includes(r.status)
  );

  const handleAppointmentUpdate = async (referralId, aptId, data) => {
    try {
      if (aptId) {
        await updateAppointment(aptId, data, mockMode);
        if (data.status === "NO_SHOW") {
          toast.success("Marked NO_SHOW — Reschedule task created for nurse");
        } else {
          toast.success("Appointment updated");
        }
      } else {
        await createAppointment(referralId, data, mockMode, { specialistName: user?.full_name });
        toast.success("Appointment added");
      }
      setSheetOpen(false);
      setSelectedRef(null);
      await loadReferrals();
    } catch (err) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleReschedule = async (referralId, appointmentId, data) => {
    try {
      await rescheduleAppointment(referralId, appointmentId, data, mockMode, {
        specialistName: user?.full_name,
      });
      toast.success("Appointment rescheduled");
      setSheetOpen(false);
      setSelectedRef(null);
      await loadReferrals();
    } catch (err) {
      toast.error(err.message || "Failed to reschedule");
    }
  };

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
        <h1 className="text-2xl font-bold text-slate-900">Specialist Portal</h1>
        <p className="text-muted-foreground mt-1">Referrals assigned to you</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">When you mark NO_SHOW</p>
          <p className="text-sm text-amber-800 mt-1">
            This triggers NEEDS_RESCHEDULE status + creates a nurse reschedule task.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Referrals Needing Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          {needsBooking.length === 0 ? (
            <EmptyState
              title="No referrals"
              description="No referrals assigned that need booking or status update."
            />
          ) : (
            <div className="space-y-4">
              {needsBooking.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border rounded-lg p-4"
                >
                  <div>
                    <p className="font-medium">{r.patient_name}</p>
                    <p className="text-sm text-muted-foreground">{r.specialty}</p>
                    <div className="flex gap-2 mt-2">
                      <StatusBadge status={r.status} />
                      <PriorityBadge priority={r.priority} />
                    </div>
                    {r.appointments?.[0] && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Appointment: {new Date(r.appointments[0].scheduled_for).toLocaleString()} —{" "}
                        {r.appointments[0].location}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/specialist/referrals/${r.id}`}>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRef(r);
                        setSheetOpen(true);
                      }}
                    >
                      Set / Update Appointment
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SpecialistAppointmentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        referral={selectedRef}
        onSuccess={handleAppointmentUpdate}
        onReschedule={handleReschedule}
        mockMode={mockMode}
      />
    </div>
  );
}
