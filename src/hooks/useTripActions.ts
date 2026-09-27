import { useMemo } from "react";
import { addDays } from "date-fns";
import { toast } from "sonner";
import type { ItineraryItem } from "@/types/trip";
import { useTripStore } from "@/store/tripStore";

/**
 * Editing operations for one trip. Every action reads the latest store state,
 * so callers never work with a stale itinerary.
 */
export const useTripActions = (tripId: string) =>
  useMemo(() => {
    const get = () => useTripStore.getState().trips[tripId];
    const setItinerary = (itinerary: ItineraryItem[]) =>
      useTripStore.getState().setItinerary(tripId, itinerary);

    /** Replaces the itinerary and offers an undo in the toast. */
    const replaceWithUndo = (itinerary: ItineraryItem[], message: string) => {
      const before = get()?.itinerary;
      setItinerary(itinerary);
      toast.success(message, {
        action: before
          ? { label: "Undo", onClick: () => setItinerary(before) }
          : undefined,
      });
    };

    return {
      upsertItem: (item: ItineraryItem) => {
        const trip = get();
        if (!trip) return;
        const exists = trip.itinerary.some((i) => i.id === item.id);
        setItinerary(
          exists
            ? trip.itinerary.map((i) => (i.id === item.id ? item : i))
            : [...trip.itinerary, item],
        );
        toast.success(
          exists ? `"${item.activity}" updated` : `"${item.activity}" added to Day ${item.day}`,
        );
      },

      removeItem: (itemId: string) => {
        const trip = get();
        const item = trip?.itinerary.find((i) => i.id === itemId);
        if (!trip || !item) return;
        replaceWithUndo(
          trip.itinerary.filter((i) => i.id !== itemId),
          `"${item.activity}" removed`,
        );
      },

      moveItemToDay: (itemId: string, day: number) => {
        const trip = get();
        const item = trip?.itinerary.find((i) => i.id === itemId);
        if (!trip || !item) return;
        setItinerary(trip.itinerary.map((i) => (i.id === itemId ? { ...i, day } : i)));
        toast.success(`"${item.activity}" moved to Day ${day}`);
      },

      /** newOrder[i] is the old day number that should become day i + 1. */
      reorderDays: (newOrder: number[]) => {
        const trip = get();
        if (!trip) return;
        const mapping: Record<number, number> = {};
        newOrder.forEach((oldDay, i) => (mapping[oldDay] = i + 1));
        setItinerary(trip.itinerary.map((i) => ({ ...i, day: mapping[i.day] ?? i.day })));
        toast.success("Days reordered");
      },

      moveDayTo: (fromDay: number, toDay: number) => {
        const trip = get();
        if (!trip || fromDay === toDay) return;
        const order = Array.from({ length: trip.tripData.days }, (_, i) => i + 1);
        const [moved] = order.splice(fromDay - 1, 1);
        order.splice(toDay - 1, 0, moved);
        const mapping: Record<number, number> = {};
        order.forEach((oldDay, i) => (mapping[oldDay] = i + 1));
        setItinerary(trip.itinerary.map((i) => ({ ...i, day: mapping[i.day] ?? i.day })));
        toast.success(`Day ${fromDay} moved to Day ${toDay}`);
      },

      addDay: () => {
        const trip = get();
        if (!trip) return;
        const { tripData } = trip;
        useTripStore.getState().setTripData(tripId, {
          ...tripData,
          days: tripData.days + 1,
          endDate: addDays(tripData.startDate, tripData.days),
        });
        toast.success(`Day ${tripData.days + 1} added`);
      },

      deleteDay: (day: number) => {
        const trip = get();
        if (!trip || trip.tripData.days <= 1) return;
        const { tripData } = trip;
        useTripStore.getState().updateTrip(tripId, {
          tripData: {
            ...tripData,
            days: tripData.days - 1,
            endDate: addDays(tripData.startDate, tripData.days - 2),
          },
          itinerary: trip.itinerary
            .filter((i) => i.day !== day)
            .map((i) => (i.day > day ? { ...i, day: i.day - 1 } : i)),
        });
        toast.success(`Day ${day} removed`);
      },

      replaceDay: (day: number, items: ItineraryItem[]) => {
        const trip = get();
        if (!trip) return;
        replaceWithUndo(
          [...trip.itinerary.filter((i) => i.day !== day), ...items],
          `Day ${day} re-planned`,
        );
      },

      replaceItem: (item: ItineraryItem) => {
        const trip = get();
        const old = trip?.itinerary.find((i) => i.id === item.id);
        if (!trip || !old) return;
        replaceWithUndo(
          trip.itinerary.map((i) => (i.id === item.id ? item : i)),
          `Swapped "${old.activity}" for "${item.activity}"`,
        );
      },

      replaceWithUndo,

      clearAll: () => replaceWithUndo([], "All activities cleared"),

      setBudget: (budget: number) => {
        const trip = get();
        if (!trip) return;
        useTripStore.getState().setTripData(tripId, { ...trip.tripData, budget });
        toast.success(`Budget set to ${trip.tripData.currency} ${budget.toLocaleString()}`);
      },
    };
  }, [tripId]);

export type TripActions = ReturnType<typeof useTripActions>;
