import { addDays, format } from "date-fns";
import { Bed, Car, MapPin, Plane, Utensils, type LucideIcon } from "lucide-react";
import type { ItemType, ItineraryItem, TripData } from "@/types/trip";

interface TypeMeta {
  label: string;
  icon: LucideIcon;
  /** Tailwind classes for badges. */
  badge: string;
  /** Solid colour for map markers and chart slices. */
  color: string;
  defaultMinutes: number;
}

export const ITEM_TYPES: Record<ItemType, TypeMeta> = {
  activity: {
    label: "Activity",
    icon: MapPin,
    badge:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
    color: "#e11d48",
    defaultMinutes: 120,
  },
  meal: {
    label: "Meal",
    icon: Utensils,
    badge:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    color: "#d97706",
    defaultMinutes: 60,
  },
  accommodation: {
    label: "Stay",
    icon: Bed,
    badge:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
    color: "#7c3aed",
    defaultMinutes: 45,
  },
  transport: {
    label: "Transport",
    icon: Car,
    badge:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    color: "#059669",
    defaultMinutes: 45,
  },
  flight: {
    label: "Flight",
    icon: Plane,
    badge:
      "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
    color: "#0284c7",
    defaultMinutes: 180,
  },
};

export const itemTypeMeta = (type: string) =>
  ITEM_TYPES[type as ItemType] ?? ITEM_TYPES.activity;

export const itemMinutes = (item: ItineraryItem) =>
  item.duration ?? itemTypeMeta(item.type).defaultMinutes;

export const byTime = (a: ItineraryItem, b: ItineraryItem) =>
  a.time.localeCompare(b.time);

export const groupByDay = (itinerary: ItineraryItem[], days: number) => {
  const grouped: ItineraryItem[][] = Array.from({ length: days }, () => []);
  for (const item of itinerary) {
    if (item.day >= 1 && item.day <= days) grouped[item.day - 1].push(item);
  }
  return grouped.map((items) => [...items].sort(byTime));
};

export const dayDate = (tripData: TripData, day: number) =>
  addDays(tripData.startDate, day - 1);

export const formatDayDate = (tripData: TripData, day: number) =>
  format(dayDate(tripData, day), "EEE, MMM d");

/** Start instant of an item, combining the trip date with its HH:mm time. */
export const itemStart = (tripData: TripData, item: ItineraryItem) => {
  const date = dayDate(tripData, item.day);
  const [h, m] = item.time.split(":").map(Number);
  date.setHours(h || 0, m || 0, 0, 0);
  return date;
};

/**
 * The destination a day most likely belongs to, splitting the trip evenly
 * across destinations in order. Used when items lack coordinates.
 */
export const destinationForDay = (tripData: TripData, day: number) => {
  const n = tripData.destinations.length || 1;
  const index = Math.min(n - 1, Math.floor(((day - 1) * n) / tripData.days));
  return tripData.destinations[index] ?? tripData.destinations[0] ?? "";
};

export const formatMoney = (currency: string, amount: number) =>
  `${currency} ${Math.round(amount).toLocaleString()}`;
