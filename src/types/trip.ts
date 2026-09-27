export type ItemType =
  | "flight"
  | "accommodation"
  | "activity"
  | "meal"
  | "transport";

export type Pace = "relaxed" | "balanced" | "packed";

export type TravelerGroup = "solo" | "couple" | "family" | "friends";

export interface TripData {
  fromDestination: string;
  destinations: string[];
  startDate: Date;
  endDate: Date;
  days: number;
  includeFlights: boolean;
  budget: number;
  currency: string;
  travelers?: TravelerGroup;
  pace?: Pace;
  styles?: string[];
}

export interface ItineraryItem {
  id: string;
  day: number;
  time: string;
  activity: string;
  location: string;
  estimatedCost: number;
  type: ItemType;
  lat?: number;
  lng?: number;
  /** Minutes; falls back to a per-type default when missing. */
  duration?: number;
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Trip {
  id: string;
  tripData: TripData;
  itinerary: ItineraryItem[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  shareId?: string;
  /** Secret returned when the share link was created; lets this browser update it. */
  shareToken?: string;
  packingList: ChecklistItem[];
  todoList: ChecklistItem[];
}
