"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { MockModeBanner } from "@/components/shared/mock-mode-banner";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { LayoutDashboard, LogOut, Stethoscope } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function NurseLayout({ children }) {
  const { user, loading, offline, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "nurse") {
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
            <Link href="/nurse" className="flex items-center gap-2 text-teal-700 font-semibold">
              <Stethoscope className="h-6 w-6" />
              Closed-Loop Referrals
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/nurse">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">{user?.full_name}</span>
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
