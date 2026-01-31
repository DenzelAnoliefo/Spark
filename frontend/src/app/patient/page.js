"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getReferrals, requestReschedule } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar, AlertCircle, Car } from "lucide-react";
import { toast } from "sonner";

export default function PatientPage() {
  const { mockMode, user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    getReferrals("mine", mockMode).then(setReferrals).finally(() => setLoading(false));
  }, [mockMode]);

  const handleRescheduleRequest = async (referralId) => {
    setActionId(referralId);
    try {
      await requestReschedule(referralId, mockMode);
      setReferrals((refs) =>
        refs.map((r) =>
          r.id === referralId ? { ...r, status: "NEEDS_RESCHEDULE" } : r
        )
      );
      toast.success("Reschedule request sent");
    } catch (err) {
      toast.error(err.message || "Failed to send request");
    } finally {
      setActionId(null);
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
        <h1 className="text-2xl font-bold text-slate-900">My Referrals</h1>
        <p className="text-muted-foreground mt-1">Hello, {user?.full_name}</p>
      </div>

      {referrals.length === 0 ? (
        <EmptyState
          title="No referrals"
          description="You don't have any active referrals at this time."
        />
      ) : (
        <div className="space-y-4">
          {referrals.map((ref) => {
            const apt = ref.appointments?.[0];
            const canReschedule =
              ["BOOKED", "CONFIRMED"].includes(ref.status) || ref.status === "NEEDS_RESCHEDULE";

            return (
              <Card key={ref.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{ref.specialty}</span>
                    <StatusBadge status={ref.status} />
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{ref.notes}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {apt && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                      <Calendar className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {new Date(apt.scheduled_for).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">{apt.location}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Button
                      size="lg"
                      className="w-full h-12 text-base"
                      variant={canReschedule && ref.status !== "NEEDS_RESCHEDULE" ? "outline" : "default"}
                      disabled={actionId === ref.id || ref.status === "NEEDS_RESCHEDULE"}
                      onClick={() => handleRescheduleRequest(ref.id)}
                    >
                      <AlertCircle className="h-5 w-5 mr-2" />
                      {ref.status === "NEEDS_RESCHEDULE"
                        ? "Reschedule requested"
                        : "I can't make it / Request reschedule"}
                    </Button>
                    {ref.transportation_needed && (
                      <Button size="lg" variant="secondary" className="w-full h-12 text-base">
                        <Car className="h-5 w-5 mr-2" />
                        Request transportation
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
