"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createReferral, getPatients } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SPECIALTIES, PRIORITIES } from "@/lib/mockData";

export default function CreateReferralPage() {
  const router = useRouter();
  const { mockMode } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    patient_id: "",
    specialty: "",
    priority: "Medium",
    notes: "",
    due_date: "",
    transportation_needed: false,
  });

  useEffect(() => {
    getPatients(mockMode).then(setPatients).finally(() => setLoading(false));
  }, [mockMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.specialty) {
      toast.error("Please select patient and specialty");
      return;
    }
    setSubmitting(true);
    try {
      await createReferral(form, mockMode);
      toast.success("Referral created");
      router.push("/nurse");
    } catch (err) {
      toast.error(err.message || "Failed to create referral");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/nurse" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Create Referral</CardTitle>
          <p className="text-sm text-muted-foreground">
            Submit a new referral for specialist care
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="patient">Patient</Label>
              <Select
                value={form.patient_id}
                onValueChange={(v) => setForm((f) => ({ ...f, patient_id: v }))}
                required
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Select
                value={form.specialty}
                onValueChange={(v) => setForm((f) => ({ ...f, specialty: v }))}
                required
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (reason for referral)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Clinical notes..."
                className="mt-2"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="due_date">Follow-up by (Due date)</Label>
              <Input
                id="due_date"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="transport"
                checked={form.transportation_needed}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, transportation_needed: v }))
                }
              />
              <Label htmlFor="transport">Transportation needed</Label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Referral"}
              </Button>
              <Link href="/nurse">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
