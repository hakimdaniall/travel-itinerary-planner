import { addDays, differenceInCalendarDays, format, subYears } from "date-fns";
import type { LatLng } from "./geo";

export interface DayWeather {
  date: string;
  code: number;
  max: number;
  min: number;
  /** True when this is last year's weather on the same date, not a forecast. */
  typical: boolean;
}

const FORECAST_DAYS = 15;

/**
 * Weather for each trip day at a location. Uses the forecast when the date is
 * within range, otherwise last year's observed weather as a "typical" guide.
 */
export const getTripWeather = async (
  where: LatLng,
  start: Date,
  days: number,
): Promise<DayWeather[]> => {
  const today = new Date();
  const end = addDays(start, days - 1);
  const inForecast =
    differenceInCalendarDays(start, today) >= 0 &&
    differenceInCalendarDays(end, today) < FORECAST_DAYS;

  const from = inForecast ? start : subYears(start, 1);
  const to = inForecast ? end : subYears(end, 1);
  const base = inForecast
    ? "https://api.open-meteo.com/v1/forecast"
    : "https://archive-api.open-meteo.com/v1/archive";

  const res = await fetch(
    `${base}?latitude=${where.lat}&longitude=${where.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${format(from, "yyyy-MM-dd")}&end_date=${format(to, "yyyy-MM-dd")}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  const daily = data.daily;
  if (!daily?.time) return [];

  return daily.time.map((_: string, i: number) => ({
    date: format(addDays(start, i), "yyyy-MM-dd"),
    code: daily.weather_code[i],
    max: Math.round(daily.temperature_2m_max[i]),
    min: Math.round(daily.temperature_2m_min[i]),
    typical: !inForecast,
  }));
};

/** WMO weather code → emoji + label. */
export const describeWeather = (code: number) => {
  if (code === 0) return { icon: "☀️", label: "Clear" };
  if (code <= 2) return { icon: "🌤️", label: "Partly cloudy" };
  if (code === 3) return { icon: "☁️", label: "Overcast" };
  if (code <= 48) return { icon: "🌫️", label: "Fog" };
  if (code <= 57) return { icon: "🌦️", label: "Drizzle" };
  if (code <= 67) return { icon: "🌧️", label: "Rain" };
  if (code <= 77) return { icon: "🌨️", label: "Snow" };
  if (code <= 82) return { icon: "🌧️", label: "Showers" };
  if (code <= 86) return { icon: "🌨️", label: "Snow showers" };
  return { icon: "⛈️", label: "Thunderstorm" };
};

export const isRainy = (code: number) =>
  (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
