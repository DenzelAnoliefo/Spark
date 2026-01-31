"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getPatients, createReferral } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { SPECIALTIES } from "@/lib/mockData";
// IMPORT THE NEW SHEET
import { AddPatientSheet } from "@/components/nurse/add-patient-sheet";

export default function NewReferralPage() {
  const router = useRouter();
  const { mockMode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  
  // Sheet State
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: "",
    specialty: "",
    priority: "Medium",
    notes: "",
    due_date: "",
    transportation_needed: false,
  });

  useEffect(() => {
    getPatients(mockMode).then(setPatients).catch(console.error);
  }, [mockMode]);

  // THE MAGIC FUNCTION: Runs when "Register Patient" finishes
  const handlePatientCreated = (newPatient) => {
    // 1. Add new patient to list
    setPatients(prev => [...prev, newPatient]);
    // 2. Auto-select them in the dropdown
    setFormData(prev => ({ ...prev, patient_id: newPatient.id }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createReferral(formData, mockMode);
      toast.success("Referral created successfully");
      router.push("/nurse");
    } catch (err) {
      toast.error("Failed to create referral");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Referral</h1>
        <p className="text-muted-foreground mt-1">Create a new specialist referral</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* PATIENT SELECTOR + QUICK ADD BUTTON */}
            <div className="space-y-2">
              <Label>Patient</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.patient_id}
                  onValueChange={(v) => setFormData({ ...formData, patient_id: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* THE NEW BUTTON */}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddPatientOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Select
                  value={formData.specialty}
                  onValueChange={(v) => setFormData({ ...formData, specialty: v })}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Date (Optional)</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2 border p-4 rounded-md">
              <Switch
                id="transport"
                checked={formData.transportation_needed}
                onCheckedChange={(c) => setFormData({ ...formData, transportation_needed: c })}
              />
              <Label htmlFor="transport">Patient requires transportation assistance</Label>
            </div>

            <div className="space-y-2">
              <Label>Clinical Notes</Label>
              <Textarea
                placeholder="Reason for referral, symptoms, history..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.patient_id || !formData.specialty}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Referral
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* THE SHEET COMPONENT */}
      <AddPatientSheet 
        open={isAddPatientOpen} 
        onOpenChange={setIsAddPatientOpen}
        onSuccess={handlePatientCreated}
        mockMode={mockMode}
      />
    </div>
  );
}