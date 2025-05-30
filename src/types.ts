export interface TripData {
  fromDestination: string;
  destinations: string[];
  startDate: Date;
  endDate: Date;
  days: number;
  includeFlights: boolean;
  budget: number;
  currency: string;
}

export interface ItineraryItem {
  tempId: string;
  day: number;
  time: string;
  activity: string;
  location: string;
  estimatedCost: number;
  type: "flight" | "accommodation" | "activity" | "meal" | "transport";
}
