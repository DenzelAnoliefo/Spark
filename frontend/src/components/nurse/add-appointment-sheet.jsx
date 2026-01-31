"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAppointment } from "@/lib/api";
import { getForecast } from "@/lib/weather";
import { toast } from "sonner";

function toDateKeyLocal(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

export function AddAppointmentSheet({ open, onOpenChange, referralId, onSuccess, mockMode }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    scheduled_for: "",
    location: "",
  });
  const [wxLoading, setWxLoading] = useState(false);
  const [wxError, setWxError] = useState("");
  const [dailyMeta, setDailyMeta] = useState([]);
  const [hourlyByDate, setHourlyByDate] = useState({});

  let selectedDateKey = null;
  let selectedHour = null;
  let selectedHourKey = null;
  let selectedDay = null;
  let apptWindow = [];

  if (form.scheduled_for) {
    const dt = new Date(form.scheduled_for);
    selectedDateKey = toDateKeyLocal(dt);
    selectedHour = dt.getHours();
    selectedHourKey = `${String(selectedHour).padStart(2, "0")}:00`;

    selectedDay = dailyMeta.find((d) => d.date === selectedDateKey) || null;

    const list = hourlyByDate[selectedDateKey] || [];
    const idx = list.findIndex(
      (h) => parseInt(h.time.slice(0, 2), 10) === selectedHour
    );

    if (idx !== -1) {
      apptWindow = list.slice(
        Math.max(0, idx - 4),
        Math.min(list.length, idx + 5)
      );
    }
  }

  useEffect(() => {
    if (!open) {
      setWxError("");
      return;
    }

    // London, ON default (same as patient)
    setWxLoading(true);
    setWxError("");

    getForecast({ lat: 42.9849, lon: -81.2453 })
      .then((res) => {
        setDailyMeta(res.daily || []);
        setHourlyByDate(res.hourlyByDate || {});
      })
      .catch(() => setWxError("Couldn’t load weather."))
      .finally(() => setWxLoading(false));
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.scheduled_for || !form.location) {
      toast.error("Please fill date/time and location");
      return;
    }
    setLoading(true);
    try {
      const apt = await createAppointment(
        referralId,
        {
          scheduled_for: new Date(form.scheduled_for).toISOString(),
          location: form.location,
        },
        mockMode
      );
      onSuccess(apt);
      onOpenChange(false);
      setForm({ scheduled_for: "", location: "" });
      toast.success("Appointment added");
    } catch (err) {
      toast.error(err.message || "Failed to add appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add / Update Appointment</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <Label htmlFor="scheduled_for">Date & Time</Label>
            <Input
              id="scheduled_for"
              type="datetime-local"
              value={form.scheduled_for}
              onChange={(e) =>
                setForm((f) => ({ ...f, scheduled_for: e.target.value }))
              }
              className="mt-2"
            />
            <div className="mt-3 rounded-lg border bg-slate-50 p-3">
              <div className="text-sm font-medium">Weather (next 7 days)</div>

              {wxLoading && <div className="mt-2 text-sm text-muted-foreground">Loading…</div>}
              {wxError && <div className="mt-2 text-sm text-red-600">{wxError}</div>}

              {!wxLoading && !wxError && dailyMeta.length > 0 && (
                <>
                  <div className="mt-2 space-y-2">
                    {dailyMeta.map((d) => (
                      <div key={d.date} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{iconForCode(d.code, true)}</span>
                          <span className={d.date === selectedDateKey ? "font-semibold" : ""}>
                            {d.date}
                          </span>
                        </div>
                        <div className="tabular-nums">
                          {Math.round(d.tMax)}° / {Math.round(d.tMin)}° · {d.rainPct}%
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected date detail */}
                  {form.scheduled_for && (
                    <div className="mt-3 border-t pt-3">
                      {selectedDay ? (
                        <>
                          <div className="text-xs font-medium text-slate-700">
                            Around selected time (±4h)
                          </div>

                          {apptWindow.length > 0 ? (
                            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                              {apptWindow.map((h, i) => {
                                const isSelected = h.time === selectedHourKey;

                                const daytime = selectedDay
                                  ? isDaytime({
                                      date: selectedDateKey,
                                      time: h.time,
                                      sunrise: selectedDay.sunrise,
                                      sunset: selectedDay.sunset,
                                    })
                                  : true;

                                return (
                                  <div
                                    key={i}
                                    className={
                                      "min-w-[96px] rounded-md border bg-white px-2 py-2 text-center space-y-0.5 " +
                                      (isSelected ? "border-teal-600 ring-2 ring-teal-200" : "")
                                    }
                                  >
                                    <div className="text-xs text-slate-500">{h.time}</div>
                                    <div className="text-lg leading-none">
                                      {iconForCode(h.code, daytime)}
                                    </div>
                                    <div className="text-sm font-semibold">{Math.round(h.temp)}°</div>
                                    <div className="text-xs text-slate-500">{h.pop}%</div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Weather forecast will be available closer to the date.
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Weather forecast will be available closer to the date.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              placeholder="e.g. County Cardiology - Room 3"
              className="mt-2"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Appointment"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
