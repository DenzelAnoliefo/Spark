"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createPatient } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AddPatientSheet({ open, onOpenChange, onSuccess, mockMode }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    history: []
  });

  const toggleHistory = (condition) => {
    setFormData(prev => {
      const exists = prev.history.includes(condition);
      return {
        ...prev,
        history: exists 
          ? prev.history.filter(h => h !== condition)
          : [...prev.history, condition]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Send to Backend
      const newPatient = await createPatient({
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        medical_history: formData.history
      }, mockMode);

      toast.success("Patient registered successfully");
      
      // 2. Pass data back to parent to auto-select
      onSuccess(newPatient);
      onOpenChange(false);
      
      // 3. Reset Form
      setFormData({ full_name: "", phone: "", email: "", history: [] });
    } catch (err) {
      toast.error("Failed to register patient");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Register New Patient</SheetTitle>
          <SheetDescription>
            Enter patient details. High-risk conditions will trigger automated triage.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input 
              required 
              placeholder="Jane Doe"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input 
              placeholder="555-0123"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Medical History (Risk Factors)</Label>
            <div className="grid gap-2 border rounded-md p-4">
              {["Cardiac History", "Diabetic", "Respiratory Issue", "Mobility Impaired"].map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox 
                    id={condition} 
                    checked={formData.history.includes(condition)}
                    onCheckedChange={() => toggleHistory(condition)}
                  />
                  <Label htmlFor={condition}>{condition}</Label>
                </div>
              ))}
            </div>
          </div>

          <SheetFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Patient
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}