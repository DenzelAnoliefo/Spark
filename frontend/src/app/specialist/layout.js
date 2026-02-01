"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { MockModeBanner } from "@/components/shared/mock-mode-banner";
import { OfflineBanner } from "@/components/shared/offline-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stethoscope, LogOut } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { SPECIALTIES, SPECIALIST_BY_SPECIALTY } from "@/lib/mockData";

export default function SpecialistLayout({ children }) {
  const { user, loading, offline, signOut, mockMode, setSelectedSpecialist } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "specialist") {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OfflineBanner offline={offline} />
      <MockModeBanner />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/specialist" className="flex items-center gap-2 text-teal-700 font-semibold">
              <Stethoscope className="h-6 w-6" />
              Closed-Loop Referrals
            </Link>
            <nav className="flex items-center gap-4">
              {!mockMode && SPECIALTIES?.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">Acting as Specialist:</span>
                  <Select
                    value={user?.id || user?.specialty || SPECIALTIES[0]}
                    onValueChange={(key) => {
                      const name = SPECIALIST_BY_SPECIALTY[key];
                      if (key) setSelectedSpecialist(key, name || "", key);
                    }}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Select specialist" />
                    </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SPECIALIST_BY_SPECIALTY[s] || s} ({s})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">{user?.full_name}</span>
              )}
              <Button variant="ghost" size="sm" onClick={() => { signOut(); router.push("/login"); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}
