"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getReferrals, requestReschedule } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar, AlertCircle, Car } from "lucide-react";
import { toast } from "sonner";

import WeatherWidget from "@/components/ui/weather-widget";
import { getForecast } from "@/lib/weather";

function toDateKeyLocal(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toHourKeyLocal(dt) {
  const h = String(dt.getHours()).padStart(2, "0");
  return `${h}:00`;
}

function isDaytime({ date, time, sunrise, sunset }) {
  if (!sunrise || !sunset) return true;

  const dt = new Date(`${date}T${time}`);
  const sr = new Date(sunrise);
  const ss = new Date(sunset);

  return dt >= sr && dt < ss;
}

function iconForCode(code, daytime = true) {
  if (code === 0) return daytime ? "☀️" : "🌙";
  if (code === 1) return daytime ? "🌤️" : "🌙☁️";
  if (code === 2) return daytime ? "⛅" : "☁️🌙";
  if (code === 3) return "☁️";

  if (code === 45 || code === 48) return "🌫️";

  if ([51, 53, 55].includes(code)) return daytime ? "🌦️" : "🌧️🌙";
  if ([56, 57].includes(code)) return "🌧️🧊";
  if ([61, 63, 65].includes(code)) return daytime ? "🌧️" : "🌧️🌙";
  if ([66, 67].includes(code)) return "🌧️🧊";
  if ([80, 81, 82].includes(code)) return daytime ? "🌧️" : "🌧️🌙";

  if ([71, 73, 75, 77].includes(code)) return "❄️";
  if ([85, 86].includes(code)) return "🌨️";

  if (code === 95) return "⛈️";
  if ([96, 99].includes(code)) return "⛈️🧊";

  return "🌡️";
}

export default function PatientPage() {
  const { mockMode, user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [hourlyByDate, setHourlyByDate] = useState({});
  const [dailyMeta, setDailyMeta] = useState([]);

  useEffect(() => {
    getReferrals("mine", mockMode).then(setReferrals).finally(() => setLoading(false));
  }, [mockMode]);

  useEffect(() => {
    getForecast({ lat: 42.9849, lon: -81.2453 })
      .then((res) => {
        setHourlyByDate(res.hourlyByDate || {});
        setDailyMeta(res.daily || []);
      })
      .catch(() => {});
  }, []);

  const handleRescheduleRequest = async (referralId) => {
    setActionId(referralId);
    try {
      await requestReschedule(referralId, mockMode);
      setReferrals((refs) =>
        refs.map((r) =>
          r.id === referralId ? { ...r, status: "NEEDS_RESCHEDULE" } : r
        )
      );
      toast.success("Reschedule request sent");
    } catch (err) {
      toast.error(err.message || "Failed to send request");
    } finally {
      setActionId(null);
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
    <>
      <WeatherWidget label="Weather forecast" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Referrals</h1>
          <p className="text-muted-foreground mt-1">Hello, {user?.full_name}</p>
        </div>

        {referrals.length === 0 ? (
          <EmptyState
            title="No referrals"
            description="You don't have any active referrals at this time."
          />
        ) : (
          <div className="space-y-4">
            {referrals.map((ref) => {
              const apt = ref.appointments?.[0];
              let apptWindow = [];
              let hourKey = null;
              let dateKey = null;
              let dayInfo = null;

              if (apt) {
                const apptDt = new Date(apt.scheduled_for);
                //Testing weather for appointment
                //const apptDt = new Date();
                //apptDt.setMinutes(0, 0, 0);
                dateKey = toDateKeyLocal(apptDt);

                const hour = apptDt.getHours();
                hourKey = `${String(hour).padStart(2, "0")}:00`;

                const list = hourlyByDate[dateKey] || [];

                // robust index: match by hour number (avoids minute mismatch problems)
                const idx = list.findIndex(
                  (h) => parseInt(h.time.slice(0, 2), 10) === hour
                );

                if (idx !== -1) {
                  apptWindow = list.slice(
                    Math.max(0, idx - 4),
                    Math.min(list.length, idx + 5)
                  );
                }

                dayInfo = dailyMeta.find((d) => d.date === dateKey) || null;
              }
              const canReschedule =
                ["BOOKED", "CONFIRMED"].includes(ref.status) || ref.status === "NEEDS_RESCHEDULE";

              return (
                <Card key={ref.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{ref.specialty}</span>
                      <StatusBadge status={ref.status} />
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{ref.notes}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {apt && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                        <Calendar className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {new Date(apt.scheduled_for).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">{apt.location}</p>
                        </div>
                      </div>
                    )}
                    {apt && apptWindow.length > 0 && (
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <div className="text-xs font-medium text-slate-700">
                          Weather around appointment
                        </div>

                        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                          {apptWindow.map((h, i) => {
                            const isApptHour = h.time === hourKey;

                            const daytime = dayInfo
                              ? isDaytime({
                                  date: dateKey,
                                  time: h.time,
                                  sunrise: dayInfo.sunrise,
                                  sunset: dayInfo.sunset,
                                })
                              : true;

                            return (
                              <div
                                key={i}
                                className={
                                  "min-w-[96px] rounded-md border bg-white px-2 py-2 text-center space-y-0.5 " +
                                  (isApptHour ? "border-teal-600 ring-2 ring-teal-200" : "")
                                }
                              >
                                <div className="text-xs text-slate-500">{h.time}</div>
                                <div className="text-lg leading-none">{iconForCode(h.code, daytime)}</div>
                                <div className="text-sm font-semibold">{Math.round(h.temp)}°</div>
                                <div className="text-xs text-slate-500">{h.pop}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {apt && apptWindow.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Appointment weather will appear closer to the date.
                      </p>
                    )}

                    <div className="flex flex-col gap-2">
                      <Button
                        size="lg"
                        className="w-full h-12 text-base"
                        variant={canReschedule && ref.status !== "NEEDS_RESCHEDULE" ? "outline" : "default"}
                        disabled={actionId === ref.id || ref.status === "NEEDS_RESCHEDULE"}
                        onClick={() => handleRescheduleRequest(ref.id)}
                      >
                        <AlertCircle className="h-5 w-5 mr-2" />
                        {ref.status === "NEEDS_RESCHEDULE"
                          ? "Reschedule requested"
                          : "I can't make it / Request reschedule"}
                      </Button>
                      {ref.transportation_needed && (
                        <Button size="lg" variant="secondary" className="w-full h-12 text-base">
                          <Car className="h-5 w-5 mr-2" />
                          Request transportation
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
