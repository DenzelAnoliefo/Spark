"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function PatientSettingsPage() {
  const { user } = useAuth();
  const [emailPref, setEmailPref] = useState(true);
  const [smsPref, setSmsPref] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-muted-foreground mt-1">Notification preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="email">Email reminders</Label>
            <Switch id="email" checked={emailPref} onCheckedChange={setEmailPref} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sms">SMS reminders</Label>
            <Switch id="sms" checked={smsPref} onCheckedChange={setSmsPref} />
          </div>
          <p className="text-xs text-muted-foreground">
            For prototype: toggles affect display only. In production, these would update your notification preferences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
