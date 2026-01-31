"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MockModeBanner } from "@/components/shared/mock-mode-banner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn, mockMode, setMockRole } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signIn(email, password);
      router.push("/");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

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
            {mockMode ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Mock mode is on. Select a role to demo:
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
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@clinic.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full">
                  Sign In
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
