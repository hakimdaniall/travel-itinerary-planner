import { addDays, startOfDay } from "date-fns";
import type { ItineraryItem, Pace, TravelerGroup, TripData } from "@/types/trip";
import { newId } from "@/store/tripStore";

type TemplateItem = Omit<ItineraryItem, "id">;

export interface TripTemplate {
  id: string;
  title: string;
  subtitle: string;
  destination: string;
  days: number;
  budget: number;
  travelers: TravelerGroup;
  pace: Pace;
  styles: string[];
  items: TemplateItem[];
}

// [day, time, activity, location, costMYR, type, lat, lng, notes?]
type Row = [number, string, string, string, number, ItineraryItem["type"], number, number, string?];

const rows = (list: Row[]): TemplateItem[] =>
  list.map(([day, time, activity, location, estimatedCost, type, lat, lng, notes]) => ({
    day, time, activity, location, estimatedCost, type, lat, lng, notes,
  }));

export const TEMPLATES: TripTemplate[] = [
  {
    id: "tokyo-3",
    title: "3 days in Tokyo",
    subtitle: "Temples, neon and ramen",
    destination: "Tokyo",
    days: 3,
    budget: 3500,
    travelers: "friends",
    pace: "balanced",
    styles: ["culture", "food", "shopping"],
    items: rows([
      [1, "08:00", "Breakfast at Tsukiji Outer Market", "Tsukiji Outer Market", 60, "meal", 35.6654, 139.7707, "Go early for tamagoyaki and fresh tuna skewers."],
      [1, "10:00", "teamLab Planets", "teamLab Planets, Toyosu", 115, "activity", 35.6492, 139.7898, "You'll wade through water; wear shorts."],
      [1, "13:00", "Lunch in Ginza", "Ginza Kagari", 55, "meal", 35.6717, 139.7650, "Famous creamy chicken ramen; the queue moves fast."],
      [1, "15:00", "Stroll Shinjuku Gyoen", "Shinjuku Gyoen National Garden", 15, "activity", 35.6852, 139.7100],
      [1, "18:30", "Yakitori in Omoide Yokocho", "Omoide Yokocho, Shinjuku", 70, "meal", 35.6932, 139.6995, "Tiny smoky alleys; cash only in most stalls."],
      [1, "21:00", "Check in", "Hotel Gracery Shinjuku", 450, "accommodation", 35.6950, 139.7020, "Godzilla head on the terrace roars on the hour."],
      [2, "08:30", "Breakfast near the hotel", "Shinjuku Station area", 30, "meal", 35.6896, 139.7006],
      [2, "10:00", "Senso-ji Temple", "Senso-ji, Asakusa", 0, "activity", 35.7148, 139.7967, "Grab an omikuji fortune for ¥100."],
      [2, "11:30", "Snack along Nakamise-dori", "Nakamise-dori", 25, "activity", 35.7119, 139.7964],
      [2, "13:00", "Tempura lunch", "Daikokuya Tempura, Asakusa", 60, "meal", 35.7127, 139.7955],
      [2, "15:00", "Tokyo Skytree", "Tokyo Skytree", 95, "activity", 35.7101, 139.8107, "Book the 350 m deck online to skip lines."],
      [2, "18:30", "Akihabara arcades & dinner", "Akihabara", 60, "meal", 35.6984, 139.7731],
      [2, "22:00", "Back to hotel", "Hotel Gracery Shinjuku", 450, "accommodation", 35.6950, 139.7020],
      [3, "09:00", "Meiji Jingu shrine", "Meiji Jingu", 0, "activity", 35.6764, 139.6993],
      [3, "11:00", "Takeshita Street", "Takeshita Street, Harajuku", 40, "activity", 35.6716, 139.7031, "Try a rainbow crepe, it's a rite of passage."],
      [3, "13:00", "Ramen at Ichiran", "Ichiran Shibuya", 45, "meal", 35.6610, 139.7016],
      [3, "15:00", "Shibuya Crossing", "Shibuya Crossing", 0, "activity", 35.6595, 139.7005],
      [3, "17:00", "Sunset at Shibuya Sky", "Shibuya Sky", 80, "activity", 35.6584, 139.7022, "Book the sunset slot a week ahead."],
      [3, "20:00", "Drinks in Golden Gai", "Golden Gai, Shinjuku", 90, "meal", 35.6940, 139.7049],
    ]),
  },
  {
    id: "bali-4",
    title: "Bali honeymoon",
    subtitle: "Rice terraces, temples and sunsets",
    destination: "Bali",
    days: 4,
    budget: 4500,
    travelers: "couple",
    pace: "relaxed",
    styles: ["relaxation", "nature", "romance"],
    items: rows([
      [1, "11:00", "Check in to a jungle villa", "Komaneka at Bisma, Ubud", 700, "accommodation", -8.5040, 115.2560],
      [1, "13:00", "Babi guling lunch", "Warung Babi Guling Ibu Oka, Ubud", 30, "meal", -8.5065, 115.2630],
      [1, "15:00", "Sacred Monkey Forest", "Sacred Monkey Forest Sanctuary, Ubud", 40, "activity", -8.5188, 115.2585, "Hide sunglasses and snacks; monkeys grab them."],
      [1, "19:00", "Candlelit dinner", "Clear Cafe, Ubud", 90, "meal", -8.5064, 115.2644],
      [2, "06:30", "Campuhan Ridge sunrise walk", "Campuhan Ridge Walk", 0, "activity", -8.5030, 115.2530, "Go before 7am, it gets hot fast."],
      [2, "09:00", "Tegallalang Rice Terraces", "Tegallalang Rice Terrace", 20, "activity", -8.4312, 115.2793],
      [2, "11:30", "Purification ritual at Tirta Empul", "Tirta Empul Temple", 25, "activity", -8.4154, 115.3153, "Sarongs are provided at the entrance."],
      [2, "13:30", "Lunch overlooking the valley", "Tegallalang", 60, "meal", -8.4330, 115.2790],
      [2, "16:00", "Couples spa", "Ubud", 250, "activity", -8.5069, 115.2625],
      [2, "20:00", "Villa night", "Komaneka at Bisma, Ubud", 700, "accommodation", -8.5040, 115.2560],
      [3, "10:00", "Drive to Seminyak", "Ubud → Seminyak", 120, "transport", -8.6913, 115.1571],
      [3, "12:00", "Check in by the beach", "W Bali – Seminyak", 900, "accommodation", -8.6796, 115.1534],
      [3, "13:30", "Beach club afternoon", "Potato Head Beach Club, Seminyak", 150, "activity", -8.6797, 115.1531],
      [3, "17:30", "Sunset at Tanah Lot", "Tanah Lot Temple", 25, "activity", -8.6212, 115.0868, "Temple sits on a rock; low tide lets you walk closer."],
      [3, "20:00", "Dinner in Seminyak", "Seminyak", 120, "meal", -8.6890, 115.1620],
      [4, "09:00", "Slow breakfast", "W Bali – Seminyak", 0, "meal", -8.6796, 115.1534],
      [4, "15:00", "Uluwatu Temple", "Uluwatu Temple", 30, "activity", -8.8291, 115.0849],
      [4, "18:00", "Kecak fire dance", "Uluwatu Temple amphitheatre", 60, "activity", -8.8286, 115.0853, "Arrive 30 minutes early for sea-view seats."],
      [4, "20:00", "Seafood on the sand", "Jimbaran Bay", 150, "meal", -8.7760, 115.1660],
    ]),
  },
  {
    id: "kl-3",
    title: "KL food weekend",
    subtitle: "Street food, skylines and rooftops",
    destination: "Kuala Lumpur",
    days: 3,
    budget: 1500,
    travelers: "friends",
    pace: "balanced",
    styles: ["food", "nightlife", "culture"],
    items: rows([
      [1, "12:00", "Check in", "Hotel Stripes Kuala Lumpur", 350, "accommodation", 3.1603, 101.6995],
      [1, "13:00", "Nasi kandar lunch", "Kampung Baru", 25, "meal", 3.1636, 101.7040],
      [1, "15:00", "Merdeka Square", "Merdeka Square", 0, "activity", 3.1478, 101.6936],
      [1, "16:30", "Central Market crafts", "Central Market (Pasar Seni)", 30, "activity", 3.1456, 101.6955],
      [1, "18:30", "Petaling Street hawker dinner", "Petaling Street", 30, "meal", 3.1437, 101.6975, "Try the air mata kucing drink."],
      [1, "21:00", "Rooftop drinks", "Heli Lounge Bar", 80, "activity", 3.1497, 101.7098, "It's a real helipad; closes if it rains."],
      [2, "07:30", "Batu Caves", "Batu Caves", 0, "activity", 3.2379, 101.6840, "Cover knees and shoulders; go early to beat the heat."],
      [2, "10:00", "Roti canai breakfast", "Batu Caves", 12, "meal", 3.2365, 101.6830],
      [2, "13:00", "Nasi lemak at Village Park", "Village Park Restaurant, Damansara Uptown", 20, "meal", 3.1355, 101.6225],
      [2, "15:30", "Thean Hou Temple", "Thean Hou Temple", 0, "activity", 3.1217, 101.6868],
      [2, "19:00", "Jalan Alor night market", "Jalan Alor", 50, "meal", 3.1455, 101.7087, "Grilled chicken wings at Wong Ah Wah are a must."],
      [2, "21:30", "Changkat bar crawl", "Changkat Bukit Bintang", 100, "activity", 3.1477, 101.7080],
      [2, "23:30", "Back to hotel", "Hotel Stripes Kuala Lumpur", 350, "accommodation", 3.1603, 101.6995],
      [3, "10:00", "KLCC Park & Twin Towers", "Petronas Twin Towers", 100, "activity", 3.1579, 101.7116],
      [3, "12:30", "Aquaria KLCC", "Aquaria KLCC", 70, "activity", 3.1537, 101.7133],
      [3, "14:30", "Lunch & shopping", "Pavilion Kuala Lumpur", 50, "meal", 3.1490, 101.7134],
      [3, "17:30", "KL Tower sky deck", "KL Tower", 60, "activity", 3.1528, 101.7039],
    ]),
  },
  {
    id: "paris-3",
    title: "Paris for two",
    subtitle: "Art, cafés and the Seine",
    destination: "Paris",
    days: 3,
    budget: 6000,
    travelers: "couple",
    pace: "balanced",
    styles: ["culture", "romance", "food"],
    items: rows([
      [1, "09:00", "Croissants at Café de Flore", "Café de Flore", 60, "meal", 48.8541, 2.3326],
      [1, "10:30", "Musée d'Orsay", "Musée d'Orsay", 170, "activity", 48.8600, 2.3266, "Don't miss the view through the giant clock."],
      [1, "13:30", "Picnic in Luxembourg Gardens", "Jardin du Luxembourg", 50, "meal", 48.8462, 2.3372],
      [1, "16:00", "Sainte-Chapelle", "Sainte-Chapelle", 120, "activity", 48.8554, 2.3450, "Go on a sunny afternoon for the stained glass."],
      [1, "17:30", "Notre-Dame", "Notre-Dame de Paris", 0, "activity", 48.8530, 2.3499],
      [1, "20:00", "Dinner cruise on the Seine", "Bateaux Mouches", 600, "meal", 48.8638, 2.3056],
      [1, "23:00", "Check in", "Hôtel des Grands Boulevards", 1100, "accommodation", 48.8716, 2.3439],
      [2, "09:00", "The Louvre", "Musée du Louvre", 220, "activity", 48.8606, 2.3376, "Enter via the Carrousel entrance to skip the pyramid queue."],
      [2, "13:00", "Falafel in Le Marais", "L'As du Fallafel", 60, "meal", 48.8572, 2.3592],
      [2, "14:30", "Wander Le Marais", "Le Marais", 0, "activity", 48.8575, 2.3625],
      [2, "18:00", "Sunset at Trocadéro", "Trocadéro", 0, "activity", 48.8616, 2.2893],
      [2, "19:00", "Eiffel Tower summit", "Eiffel Tower", 350, "activity", 48.8584, 2.2945, "Book summit tickets 60 days ahead."],
      [2, "21:30", "Back to hotel", "Hôtel des Grands Boulevards", 1100, "accommodation", 48.8716, 2.3439],
      [3, "10:00", "Sacré-Cœur & Montmartre", "Sacré-Cœur, Montmartre", 0, "activity", 48.8867, 2.3431],
      [3, "12:30", "Lunch at Le Consulat", "Le Consulat, Montmartre", 120, "meal", 48.8866, 2.3401],
      [3, "15:00", "Arc de Triomphe rooftop", "Arc de Triomphe", 140, "activity", 48.8738, 2.2950],
      [3, "16:30", "Stroll the Champs-Élysées", "Champs-Élysées", 0, "activity", 48.8698, 2.3078],
    ]),
  },
];

/** Turns a template into a new trip starting about a month from today. */
export const instantiateTemplate = (
  template: TripTemplate,
  fromDestination = "Kuala Lumpur",
): { tripData: TripData; itinerary: ItineraryItem[] } => {
  const startDate = addDays(startOfDay(new Date()), 30);
  return {
    tripData: {
      fromDestination,
      destinations: [template.destination],
      startDate,
      endDate: addDays(startDate, template.days - 1),
      days: template.days,
      includeFlights: false,
      budget: template.budget,
      currency: "MYR",
      travelers: template.travelers,
      pace: template.pace,
      styles: template.styles,
    },
    itinerary: template.items.map((item) => ({ ...item, id: newId() })),
  };
};
