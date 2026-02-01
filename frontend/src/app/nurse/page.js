"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  getReferrals,
  getTasks,
  loadDemoData,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, FileText, AlertTriangle, Database, UserPlus } from "lucide-react";
import { toast } from "sonner";

const RECENT_REFERRALS_LIMIT = 20;

export default function NurseDashboard() {
  const { mockMode, user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [refs, t] = await Promise.all([
        getReferrals("all", mockMode),
        getTasks("open", mockMode),
      ]);
      setReferrals(refs || []);
      const byNurse =
        user?.role === "nurse" && user?.id
          ? (refs || []).filter((r) => r.created_by === user.id)
          : refs || [];
      setRecentReferrals(byNurse.slice(0, RECENT_REFERRALS_LIMIT));
      setTasks(t || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mockMode, user?.id, user?.role]);

  const handleMarkTaskDone = async (taskId) => {
    try {
      const { updateTask, getTasks } = await import("@/lib/api");
      await updateTask(taskId, { status: "DONE" }, mockMode);
      const t = await getTasks("open", mockMode);
      setTasks(t || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadDemoData = async () => {
    try {
      const res = await loadDemoData(mockMode);
      toast.success(res?.message ?? "Demo data loaded");
      await loadData();
    } catch (err) {
      toast.error(err.message ?? "Failed to load demo data");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nurse Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Create referrals and manage tasks
        </p>
      </div>

      {/* Top actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/nurse/referrals/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Referral
          </Button>
        </Link>
        <Link href="/nurse/referrals/new">
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </Link>
        {!mockMode && (
          <Button variant="outline" size="sm" onClick={handleLoadDemoData}>
            <Database className="h-4 w-4 mr-2" />
            Load demo data
          </Button>
        )}
      </div>

      {/* Recent Referrals Created */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals Created</CardTitle>
          <p className="text-sm text-muted-foreground">
            {user?.role === "nurse" && user?.id
              ? "Referrals you created (acting as current nurse)"
              : "All referrals (select a nurse to filter)"}
          </p>
        </CardHeader>
        <CardContent>
          {recentReferrals.length === 0 ? (
            <EmptyState
              title="No referrals yet"
              description="Create a referral to see it here."
              action={
                <Link href="/nurse/referrals/new">
                  <Button>Create Referral</Button>
                </Link>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Specialist</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReferrals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.patient_name}
                      </TableCell>
                      <TableCell>{r.specialty}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.specialist_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Link href={`/nurse/referrals/${r.id}`}>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            Open
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Open Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Open Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open tasks</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="border-b pb-3 last:border-0 flex items-start justify-between gap-2"
                >
                  <Link
                    href={`/nurse/referrals/${t.referral_id}`}
                    className="block flex-1 min-w-0"
                  >
                    <p className="font-medium text-sm">{t.patient_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.specialty} — {t.type}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Due{" "}
                      {t.due_at ? new Date(t.due_at).toLocaleDateString() : "—"}
                    </p>
                  </Link>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMarkTaskDone(t.id)}
                  >
                    Mark done
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
