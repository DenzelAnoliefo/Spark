"use client";

import React from "react";
import { getForecast } from "@/lib/weather";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function fmtDay(iso) {
    return new Date(iso).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

function isDaytime({ date, time, sunrise, sunset }) {
    if (!sunrise || !sunset) return true; // fallback

    // Build local datetimes for comparisons (timezone already "auto" from API)
    const dt = new Date(`${date}T${time}`);
    const sr = new Date(sunrise);
    const ss = new Date(sunset);

    return dt >= sr && dt < ss;
}

function iconForCode(code, daytime = true) {
    // Clear / mostly clear
    if (code === 0) return daytime ? "☀️" : "🌙";
    if (code === 1) return daytime ? "🌤️" : "🌙☁️";
    if (code === 2) return daytime ? "⛅" : "☁️🌙";
    if (code === 3) return "☁️";

    if (code === 45 || code === 48) return "🌫️";

    if (code === 51 || code === 53 || code === 55) return daytime ? "🌦️" : "🌧️🌙";
    if (code === 56 || code === 57) return "🌧️🧊";
    if (code === 61 || code === 63 || code === 65) return daytime ? "🌧️" : "🌧️🌙";
    if (code === 66 || code === 67) return "🌧️🧊";
    if (code === 80 || code === 81 || code === 82) return daytime ? "🌧️" : "🌧️🌙";

    if (code === 71 || code === 73 || code === 75 || code === 77) return "❄️";
    if (code === 85 || code === 86) return "🌨️";

    if (code === 95) return "⛈️";
    if (code === 96 || code === 99) return "⛈️🧊";

    return "🌡️";
}

export default function WeatherWidget({
    // London, Ontario default
    lat = 42.9849,
    lon = -81.2453,
    label = "Clinic forecast",
    }) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const [daily, setDaily] = React.useState([]);
    const [hourlyByDate, setHourlyByDate] = React.useState({});
    const [selectedDate, setSelectedDate] = React.useState(null);

    const [error, setError] = React.useState("");

    async function load() {
        try {
        setError("");
        setLoading(true);

        const result = await getForecast({ lat, lon });
        setDaily(result.daily);
        setHourlyByDate(result.hourlyByDate);
        setSelectedDate(result.daily[0]?.date ?? null);
        } catch (e) {
        setError("Couldn’t load forecast.");
        } finally {
        setLoading(false);
        }
    }

    function toggle() {
        const next = !open;
        setOpen(next);
        if (next && daily.length === 0) load();
    }

    const selectedHours = selectedDate ? hourlyByDate[selectedDate] ?? [] : [];
    const selectedDayMeta = daily.find((d) => d.date === selectedDate);

    // Simple “travel risk” heuristic: snow codes or high precip chance in the day
    const today = daily[0];
    const travelRisk =
        today &&
        ((today.rainPct ?? 0) >= 40 ||
        [71, 73, 75, 77, 85, 86].includes(today.code));

    return (
        // fixed width container keeps the button from shifting
        <div className="fixed top-12 right-4 z-50 w-96 flex flex-col items-end">
        <Button variant="secondary" onClick={toggle} className="rounded-full">
            <span className="leading-none">
                ☀️🌧️
                <br />
                ❄️⛅
            </span>
            Weather
        </Button>

        {open && (
            <Card className="mt-2 w-96 p-4 shadow-lg rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
                <div className="font-semibold">{label}</div>
                <button
                className="text-sm opacity-70 hover:opacity-100"
                onClick={() => setOpen(false)}
                >
                ✕
                </button>
            </div>

            {travelRisk && !loading && !error && (
                <div className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
                ⚠️ Weather may affect travel today — consider leaving extra time.
                </div>
            )}

            <div className="mt-3 border-t" />

            <div className="mt-3 text-sm">
                {loading && <div>Loading…</div>}
                {error && <div className="text-red-600">{error}</div>}

                {!loading && !error && daily.length > 0 && (
                <div className="mt-2 grid grid-cols-[2fr_3fr] gap-3">
                    {/* LEFT: Days list */}
                    <div className="space-y-1">
                    {daily.map((d, idx) => {
                        const isSelected = d.date === selectedDate;
                        return (
                        <button
                            key={d.date}
                            onClick={() => setSelectedDate(d.date)}
                            className={
                            "w-full text-left rounded-lg px-2 py-2 hover:bg-slate-50 " +
                            (isSelected ? "bg-slate-100" : "")
                            }
                        >
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{iconForCode(d.code)}</span>
                                <div className="font-medium">
                                {idx === 0 ? "Today" : fmtDay(d.date)}
                                </div>
                            </div>
                            <div className="text-sm tabular-nums">
                                {Math.round(d.tMax)}°
                            </div>
                            </div>

                            <div className="text-xs text-muted-foreground">
                            low {Math.round(d.tMin)}° · precip {d.rainPct}%
                            </div>
                        </button>
                        );
                    })}
                    </div>

                    {/* RIGHT: Hourly */}
                    <div className="rounded-lg border bg-white">
                    <div className="px-3 py-2 border-b text-sm font-medium">
                        Hourly
                    </div>

                    <div className="max-h-110 overflow-y-auto px-3 py-2 space-y-2">
                        {selectedHours.length === 0 ? (
                        <div className="text-xs text-muted-foreground">
                            No hourly data.
                        </div>
                        ) : (
                        selectedHours.slice(0, 24).map((h, i) => (
                            <div
                            key={i}
                            className="flex items-center justify-between"
                            >
                            <div className="flex items-center gap-2">
                                <span>
                                    {iconForCode(
                                        h.code,
                                        selectedDayMeta
                                        ? isDaytime({
                                            date: selectedDate,
                                            time: h.time,
                                            sunrise: selectedDayMeta.sunrise,
                                            sunset: selectedDayMeta.sunset,
                                            })
                                        : true
                                    )}
                                </span>
                                <span className="text-sm tabular-nums w-12">
                                {h.time}
                                </span>
                            </div>
                            <div className="text-sm tabular-nums">
                                {Math.round(h.temp)}° · {h.pop}%
                            </div>
                            </div>
                        ))
                        )}
                    </div>
                    </div>
                </div>
                )}
            </div>
            </Card>
        )}
        </div>
    );
}