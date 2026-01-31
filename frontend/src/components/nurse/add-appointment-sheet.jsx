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
import { createAppointment } from "@/lib/api";
import { toast } from "sonner";

export function AddAppointmentSheet({ open, onOpenChange, referralId, onSuccess, mockMode }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    scheduled_for: "",
    location: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.scheduled_for || !form.location) {
      toast.error("Please fill date/time and location");
      return;
    }
    setLoading(true);
    try {
      const apt = await createAppointment(
        referralId,
        {
          scheduled_for: new Date(form.scheduled_for).toISOString(),
          location: form.location,
        },
        mockMode
      );
      onSuccess(apt);
      onOpenChange(false);
      setForm({ scheduled_for: "", location: "" });
      toast.success("Appointment added");
    } catch (err) {
      toast.error(err.message || "Failed to add appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add / Update Appointment</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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
              placeholder="e.g. County Cardiology - Room 3"
              className="mt-2"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Appointment"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
