// src/lib/weather.js
export async function getForecast({ lat, lon }) {
    const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        timezone: "auto",

        // Daily summary
        daily: [
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "weathercode",
        "sunrise",
        "sunset",
        ].join(","),

        // Hourly drill-down
        hourly: [
        "temperature_2m",
        "precipitation_probability",
        "weathercode",
        ].join(","),
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather fetch failed");
    const data = await res.json();

    const daily = data.daily.time.map((date, i) => ({
        date,
        tMax: data.daily.temperature_2m_max[i],
        tMin: data.daily.temperature_2m_min[i],
        rainPct: data.daily.precipitation_probability_max?.[i] ?? 0,
        code: data.daily.weathercode?.[i] ?? null,
        sunrise: data.daily.sunrise?.[i] ?? null,
        sunset: data.daily.sunset?.[i] ?? null,
    }));

    // Group hourly by date (YYYY-MM-DD)
    const hourlyByDate = {};
    const times = data.hourly.time;

    for (let i = 0; i < times.length; i++) {
        const iso = times[i];              // "2026-01-31T13:00"
        const date = iso.slice(0, 10);     // "2026-01-31"
        const time = iso.slice(11, 16);    // "13:00"

        if (!hourlyByDate[date]) hourlyByDate[date] = [];
        hourlyByDate[date].push({
        time,
        temp: data.hourly.temperature_2m[i],
        pop: data.hourly.precipitation_probability?.[i] ?? 0,
        code: data.hourly.weathercode?.[i] ?? null,
        });
    }

    return {
        daily: daily.slice(0, 5),
        hourlyByDate,
    };
}
