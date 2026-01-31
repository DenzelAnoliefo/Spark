"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  getReferrals,
  getTasks,
  getClinics,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, FileText, AlertTriangle } from "lucide-react";
import { REFERRAL_STATUSES, SPECIALTIES } from "@/lib/mockData";

export default function NurseDashboard() {
  const { mockMode } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    specialty: "all",
    atRisk: false,
  });
  const [clinic, setClinic] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [refs, t, c] = await Promise.all([
          getReferrals("all", mockMode),
          getTasks("open", mockMode),
          getClinics(mockMode),
        ]);
        setReferrals(refs);
        setTasks(t);
        setClinics(c);
        if (c?.length && !clinic) setClinic(c[0]?.id || "");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mockMode]);

  const filtered = referrals.filter((r) => {
    if (filters.status !== "all" && r.status !== filters.status) return false;
    if (filters.priority !== "all" && r.priority !== filters.priority) return false;
    if (filters.specialty !== "all" && r.specialty !== filters.specialty) return false;
    if (filters.atRisk) {
      const overdue = r.due_date && new Date(r.due_date) < new Date();
      const needsReschedule = r.status === "NEEDS_RESCHEDULE" || r.status === "NO_SHOW";
      if (!overdue && !needsReschedule) return false;
    }
    return true;
  });

  const kpis = {
    totalOpen: referrals.filter((r) => !["CLOSED", "ATTENDED"].includes(r.status)).length,
    needsReschedule: referrals.filter((r) => r.status === "NEEDS_RESCHEDULE").length,
    highPriority: referrals.filter((r) => r.priority === "High").length,
    upcoming: referrals.filter((r) => {
      const apt = r.appointments?.[0];
      if (!apt) return false;
      const d = new Date(apt.scheduled_for);
      return d > new Date() && ["BOOKED", "CONFIRMED"].includes(r.status);
    }).length,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Referral Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage and track all referrals</p>
        </div>
        <div className="flex items-center gap-3">
          {clinics?.length > 0 && (
            <Select value={clinic} onValueChange={setClinic}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Clinic" />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Link href="/nurse/referrals/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Referral
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.totalOpen}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Needs Reschedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{kpis.needsReschedule}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{kpis.highPriority}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{kpis.upcoming}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <CardTitle>Referrals</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={filters.status}
                    onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      {REFERRAL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.priority}
                    onValueChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priority</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.specialty}
                    onValueChange={(v) => setFilters((f) => ({ ...f, specialty: v }))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All specialty</SelectItem>
                      {SPECIALTIES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.atRisk}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, atRisk: e.target.checked }))
                      }
                    />
                    At risk
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <EmptyState
                  title="No referrals"
                  description="Create a referral to get started."
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
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.patient_name}</TableCell>
                        <TableCell>{r.specialty}</TableCell>
                        <TableCell>
                          <PriorityBadge priority={r.priority} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.due_date ? new Date(r.due_date).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Link href={`/nurse/referrals/${r.id}`}>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
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
        </div>

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
                  <li key={t.id} className="border-b pb-3 last:border-0">
                    <Link href={`/nurse/referrals/${t.referral_id}`} className="block">
                      <p className="font-medium text-sm">{t.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{t.specialty} — {t.type}</p>
                      <p className="text-xs text-amber-600 mt-1">
                        Due {new Date(t.due_at).toLocaleDateString()}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
