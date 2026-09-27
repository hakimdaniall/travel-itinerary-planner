import type { Trip } from "@/types/trip";
import { parseTripFile, serializeTrip } from "@/store/tripStore";

const baseUrl = import.meta.env.PROD
  ? "/.netlify/functions"
  : "http://localhost:8888/.netlify/functions";

const request = async <T>(init: RequestInit, query = ""): Promise<T> => {
  const res = await fetch(`${baseUrl}/share-trip${query}`, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
};

/** Publishes the trip (or refreshes an existing link) and returns its share id and token. */
export const publishTrip = async (trip: Trip) => {
  const payload = serializeTrip(trip);
  if (trip.shareId && trip.shareToken) {
    try {
      await request<{ id: string }>({
        method: "PUT",
        body: JSON.stringify({ id: trip.shareId, token: trip.shareToken, trip: payload }),
      });
      return { id: trip.shareId, token: trip.shareToken };
    } catch {
      // Link was removed or token lost; fall through and create a new one.
    }
  }
  return request<{ id: string; token: string }>({
    method: "POST",
    body: JSON.stringify({ trip: payload }),
  });
};

export const fetchSharedTrip = async (id: string) => {
  const data = await request<{ trip: unknown }>(
    { method: "GET" },
    `?id=${encodeURIComponent(id)}`,
  );
  return parseTripFile(JSON.stringify(data.trip));
};

export const shareUrl = (id: string) => `${window.location.origin}/share/${id}`;
