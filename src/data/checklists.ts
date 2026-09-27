import type { ChecklistItem, TripData } from "@/types/trip";

const toItems = (texts: string[]): ChecklistItem[] =>
  texts.map((text, i) => ({ id: `${Date.now()}-${i}`, text, done: false }));

export const defaultPackingList = (tripData: TripData): ChecklistItem[] => {
  const base = [
    "Passport / ID",
    "Phone charger & power bank",
    "Travel adapter",
    "Toiletries",
    "Medication & first-aid kit",
    "Comfortable walking shoes",
    `Clothes for ${tripData.days} day${tripData.days > 1 ? "s" : ""}`,
    "Reusable water bottle",
  ];
  const styles = tripData.styles ?? [];
  if (styles.includes("adventure")) base.push("Hiking gear", "Sunscreen");
  if (styles.includes("relaxation")) base.push("Swimwear", "A good book");
  if (styles.includes("nightlife")) base.push("Going-out outfit");
  if (tripData.travelers === "family") base.push("Snacks & entertainment for kids");
  return toItems(base);
};

export const defaultTodoList = (tripData: TripData): ChecklistItem[] =>
  toItems([
    ...(tripData.includeFlights ? ["Book flights"] : []),
    "Book accommodation",
    "Check visa / entry requirements",
    "Buy travel insurance",
    "Notify bank of travel",
    `Get some local cash for ${tripData.destinations[0] ?? "the trip"}`,
    "Download offline maps",
  ]);
