import { useEffect, useRef } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { ItineraryItem, TripData } from "@/types/trip";
import { geocodeCity, geocodePlace, hasCoords } from "@/lib/geo";
import { getDestinationPhoto, getPlaceInfo } from "@/lib/photos";
import { getTripWeather, type DayWeather } from "@/lib/weather";
import { destinationForDay, dayDate } from "@/lib/itinerary";
import { useTripStore } from "@/store/tripStore";

const FOREVER = { staleTime: Infinity, gcTime: 1000 * 60 * 60 } as const;

export const useDestinationPhoto = (destination: string | undefined) =>
  useQuery({
    queryKey: ["destination-photo", destination],
    queryFn: () => getDestinationPhoto(destination!),
    enabled: !!destination,
    ...FOREVER,
  });

export const useCityCoords = (city: string | undefined) =>
  useQuery({
    queryKey: ["city-coords", city],
    queryFn: () => geocodeCity(city!),
    enabled: !!city,
    ...FOREVER,
  });

export const usePlaceInfo = (
  item: Pick<ItineraryItem, "location" | "activity" | "type">,
  city: string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: ["place-info", item.location, city],
    queryFn: () => getPlaceInfo(item.location, city),
    // Photos only make sense for sights, not meals or check-ins.
    enabled: enabled && item.type === "activity" && !!item.location,
    ...FOREVER,
  });

/** Weather per trip day (index 0 = day 1), using each day's destination. */
export const useTripWeather = (tripData: TripData) => {
  const destinations = [...new Set(tripData.destinations)];
  const start = format(tripData.startDate, "yyyy-MM-dd");

  const results = useQueries({
    queries: destinations.map((city) => ({
      queryKey: ["weather", city, start, tripData.days],
      queryFn: async () => {
        const coords = await geocodeCity(city);
        return coords ? getTripWeather(coords, tripData.startDate, tripData.days) : [];
      },
      ...FOREVER,
      staleTime: 1000 * 60 * 60,
    })),
  });

  return Array.from({ length: tripData.days }, (_, i): DayWeather | undefined => {
    const city = destinationForDay(tripData, i + 1);
    const data = results[destinations.indexOf(city)]?.data;
    const date = format(dayDate(tripData, i + 1), "yyyy-MM-dd");
    return data?.find((w) => w.date === date);
  });
};

/**
 * Fills in missing coordinates for a trip's items in the background, one
 * request at a time to respect the free geocoder's rate limits.
 */
export const useGeocodeItinerary = (tripId: string | undefined) => {
  const itinerary = useTripStore((s) => (tripId ? s.trips[tripId]?.itinerary : undefined));
  const attempted = useRef(new Set<string>());
  const running = useRef(false);

  useEffect(() => {
    if (!tripId || !itinerary || running.current) return;
    const pending = itinerary.filter(
      (i) => !hasCoords(i) && !attempted.current.has(i.id) && i.type !== "flight",
    );
    if (pending.length === 0) return;

    running.current = true;
    let cancelled = false;

    (async () => {
      for (const item of pending) {
        if (cancelled) break;
        attempted.current.add(item.id);
        const trip = useTripStore.getState().trips[tripId];
        if (!trip) break;
        const city = destinationForDay(trip.tripData, item.day);
        try {
          const near = await geocodeCity(city);
          const coords = await geocodePlace(item.location, near ?? undefined);
          // Apply even if the effect re-ran meanwhile; the patch reads the latest state.
          if (!coords) continue;
          const latest = useTripStore.getState().trips[tripId];
          if (!latest) break;
          useTripStore.getState().setItinerary(
            tripId,
            latest.itinerary.map((i) =>
              i.id === item.id && !hasCoords(i) ? { ...i, ...coords } : i,
            ),
          );
        } catch {
          // Network hiccup; the item simply stays off the map.
        }
      }
      running.current = false;
    })();

    return () => {
      cancelled = true;
      running.current = false;
    };
  }, [tripId, itinerary]);
};
