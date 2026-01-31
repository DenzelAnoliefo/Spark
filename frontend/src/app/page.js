"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      const role = user.role;
      if (role === "nurse") router.replace("/nurse");
      else if (role === "patient") router.replace("/patient");
      else if (role === "specialist") router.replace("/specialist");
      else router.replace("/nurse");
    } else {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <LoadingSpinner className="h-10 w-10" />
    </div>
  );
}
