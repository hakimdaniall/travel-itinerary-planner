import { createContext, useContext, useState } from "react";
import type { Trip } from "@/types/trip";
import type { TripActions } from "@/hooks/useTripActions";

interface TripContextValue {
  trip: Trip;
  /** Undefined for read-only (shared) trips. */
  actions?: TripActions;
  /** The item hovered or selected in a list, highlighted on the map. */
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}

const TripContext = createContext<TripContextValue | null>(null);

export const TripProvider = ({
  trip,
  actions,
  children,
}: {
  trip: Trip;
  actions?: TripActions;
  children: React.ReactNode;
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  return (
    <TripContext.Provider value={{ trip, actions, activeId, setActiveId }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTripContext = () => {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTripContext must be used inside TripProvider");
  return ctx;
};
