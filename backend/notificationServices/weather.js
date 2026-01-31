import axios from "axios";

export async function getWeather(datetime) {
  if (!datetime) return "Weather forecast unavailable (no date provided)";

  const dateObj = new Date(datetime);
  if (isNaN(dateObj)) return "Weather forecast unavailable (invalid date)";

  try {
    const latitude = 51.5074;
    const longitude = -0.1278;

    const res = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode,windspeed_10m&timezone=Europe/London`
    );

    const data = res.data;

    const targetHour = dateObj.toISOString().slice(0,13) + ":00";
    const index = data.hourly.time.findIndex(t => t.startsWith(targetHour));
    if (index === -1) return "Weather forecast unavailable for that date/time";

    const temp = data.hourly.temperature_2m[index];
    const wind = data.hourly.windspeed_10m[index];
    const weatherCode = data.hourly.weathercode[index];

    return `The forecast for your appointment time is ${weatherCodeToText(weatherCode)}, ${temp}°C, wind ${wind} km/h.`;
  } catch (err) {
    console.error("Error fetching weather:", err.message);
    return "Weather forecast unavailable";
  }
}

function weatherCodeToText(code) {
  const mapping = {
    0: "clear sky ☀️",
    1: "mainly clear 🌤️",
    2: "partly cloudy ⛅",
    3: "overcast ☁️",
    45: "fog 🌫️",
    48: "depositing rime fog 🌁",
    51: "light drizzle 🌦️",
    53: "moderate drizzle 🌦️",
    55: "dense drizzle 🌧️",
    56: "light freezing drizzle 🌧️❄️",
    57: "heavy freezing drizzle 🌧️❄️",
    61: "slight rain 🌧️",
    63: "moderate rain 🌧️",
    65: "heavy rain ⛈️",
    66: "light freezing rain 🌧️❄️",
    67: "heavy freezing rain 🌧️❄️",
    71: "slight snow 🌨️",
    73: "moderate snow 🌨️",
    75: "heavy snow ❄️🌨️",
    77: "snow grains ❄️",
    80: "slight rain showers 🌦️",
    81: "moderate rain showers 🌧️",
    82: "violent rain showers ⛈️",
    85: "slight snow showers 🌨️",
    86: "heavy snow showers ❄️🌨️",
    95: "thunderstorm ⚡🌧️",
    96: "thunderstorm with slight hail ⚡🌨️",
    99: "thunderstorm with heavy hail ⚡❄️🌨️"
  };
  return mapping[code] || "unknown weather";
}
