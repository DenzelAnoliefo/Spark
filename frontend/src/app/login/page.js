"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MockModeBanner } from "@/components/shared/mock-mode-banner";

export default function LoginPage() {
  const { mockMode, setMockRole } = useAuth();
  const router = useRouter();

  const handleMockLogin = (role) => {
    setMockRole(role);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100">
      <MockModeBanner />
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-teal-900">Closed-Loop Referrals</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {mockMode
                  ? "Mock mode is on. Select a role to demo:"
                  : "Using live data. Select a role to continue (no password required):"}
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => handleMockLogin("nurse")} className="w-full">
                  Login as Nurse
                </Button>
                <Button onClick={() => handleMockLogin("patient")} variant="secondary" className="w-full">
                  Login as Patient
                </Button>
                <Button onClick={() => handleMockLogin("specialist")} variant="secondary" className="w-full">
                  Login as Specialist
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
