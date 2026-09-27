import type { ItineraryItem } from "@/types/trip";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceSuggestion extends LatLng {
  id: string;
  name: string;
  /** Secondary text such as "Selangor, Malaysia". */
  detail: string;
}

/** City / region search. Open-Meteo returns English names ranked by population. */
export const searchCities = async (
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> => {
  if (query.trim().length < 2) return [];
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en`,
    { signal },
  );
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();
  return (data.results ?? []).map(
    (r: {
      id: number;
      name: string;
      admin1?: string;
      country?: string;
      latitude: number;
      longitude: number;
    }) => ({
      id: String(r.id),
      name: r.name,
      detail: [r.admin1, r.country].filter(Boolean).join(", "),
      lat: r.latitude,
      lng: r.longitude,
    }),
  );
};

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id: number;
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

/** Point-of-interest search (restaurants, landmarks, hotels) biased toward `near`. */
export const searchPlaces = async (
  query: string,
  near?: LatLng,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> => {
  if (query.trim().length < 2) return [];
  const bias = near ? `&lat=${near.lat}&lon=${near.lng}` : "";
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=6&lang=en${bias}`,
    { signal },
  );
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();
  return (data.features as PhotonFeature[])
    .filter((f) => f.properties.name)
    .map((f) => ({
      id: String(f.properties.osm_id),
      name: f.properties.name!,
      detail: [f.properties.street, f.properties.city, f.properties.country]
        .filter(Boolean)
        .join(", "),
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));
};

const CACHE_KEY = "tripplanner-geocode-cache";

const readCache = (): Record<string, LatLng | null> => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeCache = (cache: Record<string, LatLng | null>) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or unavailable; geocoding still works uncached.
  }
};

/** Resolves a city name to coordinates, cached across sessions. */
export const geocodeCity = async (name: string): Promise<LatLng | null> => {
  const key = `city:${name.toLowerCase().trim()}`;
  const cache = readCache();
  if (key in cache) return cache[key];
  const [first] = await searchCities(name);
  const result = first ? { lat: first.lat, lng: first.lng } : null;
  writeCache({ ...readCache(), [key]: result });
  return result;
};

/**
 * Resolves a free-text location to coordinates near `near`, cached. Results
 * further than `maxKm` from `near` are rejected, since they are almost always
 * a same-named place in another city.
 */
export const geocodePlace = async (
  query: string,
  near?: LatLng,
  maxKm = 80,
): Promise<LatLng | null> => {
  const key = `place:${query.toLowerCase().trim()}@${near ? `${near.lat.toFixed(1)},${near.lng.toFixed(1)}` : ""}`;
  const cache = readCache();
  if (key in cache) return cache[key];
  const results = await searchPlaces(query, near);
  const match = results.find(
    (r) => !near || haversineKm(near, r) <= maxKm,
  );
  const result = match ? { lat: match.lat, lng: match.lng } : null;
  writeCache({ ...readCache(), [key]: result });
  return result;
};

export const haversineKm = (a: LatLng, b: LatLng) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export type LegMode = "walk" | "drive" | "fly";

export interface Leg {
  km: number;
  minutes: number;
  mode: LegMode;
}

/**
 * Rough travel estimate between two points. Straight-line distance is
 * inflated by 1.3 to approximate real street routes.
 */
export const estimateLeg = (a: LatLng, b: LatLng): Leg => {
  const straight = haversineKm(a, b);
  const km = straight * 1.3;
  if (straight > 300) {
    return { km: straight, minutes: Math.round((straight / 750) * 60 + 90), mode: "fly" };
  }
  if (km <= 1.5) {
    return { km, minutes: Math.max(1, Math.round((km / 4.8) * 60)), mode: "walk" };
  }
  const speed = km < 15 ? 22 : km < 60 ? 40 : 70;
  return { km, minutes: Math.round((km / speed) * 60 + 5), mode: "drive" };
};

export const hasCoords = (
  item: ItineraryItem,
): item is ItineraryItem & LatLng =>
  typeof item.lat === "number" && typeof item.lng === "number";

export const formatDistance = (km: number) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;

export const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const googleMapsUrl = (location: string, city?: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    city && !location.toLowerCase().includes(city.toLowerCase())
      ? `${location}, ${city}`
      : location,
  )}`;
