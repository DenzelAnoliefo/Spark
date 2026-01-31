"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SpecialistAppointmentSheet({
  open,
  onOpenChange,
  referral,
  onSuccess,
  mockMode,
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    scheduled_for: "",
    location: "",
    status: "SCHEDULED",
  });

  const apt = referral?.appointments?.[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!referral) return;
    if (!apt && (!form.scheduled_for || !form.location)) {
      return;
    }
    setLoading(true);
    try {
      if (apt) {
        await onSuccess(referral.id, apt.id, {
          status: form.status === "ATTENDED" || form.status === "NO_SHOW" ? form.status : apt.status,
        });
        if (form.status === "ATTENDED" || form.status === "NO_SHOW") {
          // Handled in onSuccess
        }
      } else {
        await onSuccess(referral.id, null, {
          scheduled_for: new Date(form.scheduled_for).toISOString(),
          location: form.location,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNoShow = async () => {
    if (!referral?.appointments?.[0]) return;
    setLoading(true);
    try {
      await onSuccess(referral.id, referral.appointments[0].id, { status: "NO_SHOW" });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttended = async () => {
    if (!referral?.appointments?.[0]) return;
    setLoading(true);
    try {
      await onSuccess(referral.id, referral.appointments[0].id, { status: "ATTENDED" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {apt ? "Update Appointment" : "Add Appointment"} — {referral?.patient_name}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {apt ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {new Date(apt.scheduled_for).toLocaleString()} at {apt.location}
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={handleMarkAttended} disabled={loading}>
                  Mark ATTENDED
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleMarkNoShow}
                  disabled={loading}
                >
                  Mark NO_SHOW (triggers reschedule task)
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="scheduled_for">Date & Time</Label>
                <Input
                  id="scheduled_for"
                  type="datetime-local"
                  value={form.scheduled_for}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, scheduled_for: e.target.value }))
                  }
                  className="mt-2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="e.g. Room 3, Bldg A"
                  className="mt-2"
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Add Appointment"}
              </Button>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
