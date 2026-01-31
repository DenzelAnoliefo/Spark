"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { MockModeBanner } from "@/components/shared/mock-mode-banner";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { Stethoscope, LogOut, Bell, Settings } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";

export default function PatientLayout({ children }) {
  const { user, loading, offline, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "patient") {
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
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/patient" className="flex items-center gap-2 text-teal-700 font-semibold">
              <Stethoscope className="h-6 w-6" />
              <span className="hidden sm:inline">Closed-Loop Referrals</span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/patient/notifications">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/patient/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => { signOut(); router.push("/login"); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">{children}</main>
    </div>
  );
}
