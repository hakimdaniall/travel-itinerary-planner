import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChecklistItem, ItineraryItem, Trip, TripData } from "@/types/trip";
import { defaultPackingList, defaultTodoList } from "@/data/checklists";

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface TripState {
  trips: Record<string, Trip>;
  createTrip: (
    tripData: TripData,
    itinerary?: ItineraryItem[],
    extra?: Partial<Trip>,
  ) => string;
  updateTrip: (id: string, patch: Partial<Omit<Trip, "id">>) => void;
  setItinerary: (id: string, itinerary: ItineraryItem[]) => void;
  setTripData: (id: string, tripData: TripData) => void;
  setChecklist: (
    id: string,
    list: "packingList" | "todoList",
    items: ChecklistItem[],
  ) => void;
  deleteTrip: (id: string) => void;
}

const DATE_KEYS = new Set(["startDate", "endDate"]);

export const useTripStore = create<TripState>()(
  persist(
    (set) => {
      const touch = (id: string, patch: Partial<Trip>) =>
        set((state) => {
          const trip = state.trips[id];
          if (!trip) return state;
          return {
            trips: {
              ...state.trips,
              [id]: { ...trip, ...patch, updatedAt: new Date().toISOString() },
            },
          };
        });

      return {
        trips: {},
        createTrip: (tripData, itinerary = [], extra = {}) => {
          const id = newId();
          const now = new Date().toISOString();
          const trip: Trip = {
            id,
            tripData,
            itinerary,
            createdAt: now,
            updatedAt: now,
            packingList: defaultPackingList(tripData),
            todoList: defaultTodoList(tripData),
            ...extra,
          };
          set((state) => ({ trips: { ...state.trips, [id]: trip } }));
          return id;
        },
        updateTrip: (id, patch) => touch(id, patch),
        setItinerary: (id, itinerary) => touch(id, { itinerary }),
        setTripData: (id, tripData) => touch(id, { tripData }),
        setChecklist: (id, list, items) => touch(id, { [list]: items }),
        deleteTrip: (id) =>
          set((state) => {
            const { [id]: _removed, ...rest } = state.trips;
            return { trips: rest };
          }),
      };
    },
    {
      name: "tripplanner-trips",
      version: 1,
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) =>
          DATE_KEYS.has(key) && typeof value === "string"
            ? new Date(value)
            : value,
      }),
    },
  ),
);

export const useTrip = (id: string | undefined) =>
  useTripStore((state) => (id ? state.trips[id] : undefined));

/** Parses a saved JSON export (v1.0 format) into trip parts. */
export const parseTripFile = (raw: string) => {
  const data = JSON.parse(raw);
  if (!data.tripData || !Array.isArray(data.itinerary)) {
    throw new Error("Invalid itinerary file format");
  }
  const tripData: TripData = {
    ...data.tripData,
    startDate: new Date(data.tripData.startDate),
    endDate: new Date(data.tripData.endDate),
  };
  return {
    tripData,
    itinerary: data.itinerary as ItineraryItem[],
    createdBy: data.createdBy as string | undefined,
    packingList: data.packingList as ChecklistItem[] | undefined,
    todoList: data.todoList as ChecklistItem[] | undefined,
  };
};

export const serializeTrip = (trip: Trip, createdBy?: string) => ({
  version: "1.1",
  savedAt: new Date().toISOString(),
  createdBy: createdBy ?? trip.createdBy,
  tripData: {
    ...trip.tripData,
    startDate: trip.tripData.startDate.toISOString(),
    endDate: trip.tripData.endDate.toISOString(),
  },
  itinerary: trip.itinerary,
  packingList: trip.packingList,
  todoList: trip.todoList,
});

/** Opens a file picker and resolves with the parsed trip file. */
export const pickTripFile = () =>
  new Promise<ReturnType<typeof parseTripFile>>((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      file
        .text()
        .then((text) => resolve(parseTripFile(text)))
        .catch(reject);
    };
    input.click();
  });
