import type { ItemType, ItineraryItem, TripData } from "@/types/trip";
import { newId } from "@/store/tripStore";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

const ITEM_TYPES: ItemType[] = [
  "flight",
  "accommodation",
  "activity",
  "meal",
  "transport",
];

const ITEM_SCHEMA = `{
  "day": number,
  "time": string,            // HH:mm, 24-hour
  "activity": string,        // short title, e.g. "Explore Senso-ji Temple"
  "location": string,        // specific real place name, e.g. "Senso-ji, Asakusa"
  "estimatedCost": number,   // in the trip currency, per group, 0 if free
  "type": "flight" | "accommodation" | "activity" | "meal" | "transport",
  "lat": number,             // latitude of the location, 4 decimals
  "lng": number,             // longitude of the location, 4 decimals
  "duration": number,        // minutes
  "notes": string            // one short insider tip, max 15 words
}`;

const PACE_RULES = {
  relaxed: "3-4 items per day with long breaks; no early starts",
  balanced: "5-6 items per day",
  packed: "7-9 items per day, starting early",
};

const tripContext = (tripData: TripData) => {
  const lines = [
    `Origin: ${tripData.fromDestination}`,
    `Destinations (in order): ${tripData.destinations.join(" → ")}`,
    `Dates: ${tripData.startDate.toDateString()} to ${tripData.endDate.toDateString()} (${tripData.days} days)`,
    `Total budget: ${tripData.currency} ${tripData.budget}`,
    `Include flights: ${tripData.includeFlights ? "yes" : "no"}`,
  ];
  if (tripData.travelers) lines.push(`Travelling as: ${tripData.travelers}`);
  if (tripData.pace) lines.push(`Pace: ${tripData.pace}`);
  if (tripData.styles?.length)
    lines.push(`Interests: ${tripData.styles.join(", ")}`);
  return lines.join("\n");
};

const toNumber = (v: unknown) => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : undefined;
};

/** Coerces a model-produced object into a valid ItineraryItem. */
const normalizeItem = (
  raw: Record<string, unknown>,
  fallbackDay: number,
): ItineraryItem | null => {
  if (!raw || typeof raw.activity !== "string") return null;
  const time =
    typeof raw.time === "string" && /^\d{1,2}:\d{2}$/.test(raw.time)
      ? raw.time.padStart(5, "0")
      : "09:00";
  const type = ITEM_TYPES.includes(raw.type as ItemType)
    ? (raw.type as ItemType)
    : "activity";
  const lat = toNumber(raw.lat);
  const lng = toNumber(raw.lng);
  const validCoords =
    lat !== undefined && lng !== undefined && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
  return {
    id: newId(),
    day: Math.max(1, Math.round(toNumber(raw.day) ?? fallbackDay)),
    time,
    activity: raw.activity,
    location: typeof raw.location === "string" ? raw.location : raw.activity,
    estimatedCost: Math.max(0, Math.round(toNumber(raw.estimatedCost) ?? 0)),
    type,
    ...(validCoords ? { lat, lng } : {}),
    duration: toNumber(raw.duration),
    notes: typeof raw.notes === "string" && raw.notes ? raw.notes : undefined,
  };
};

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const requestBody = (messages: ChatMessage[], stream: boolean) =>
  JSON.stringify({
    model: MODEL,
    stream,
    reasoning_effort: "low",
    max_completion_tokens: 32000,
    response_format: { type: "json_object" },
    messages,
  });

const completeJson = async <T>(
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<T> => {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: requestBody(messages, false),
    signal,
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content) as T;
};

/**
 * Incrementally pulls complete objects out of the first JSON array in a
 * streamed response, so items can be shown as soon as each one closes.
 */
class ArrayItemExtractor {
  private buffer = "";
  private pos = 0;
  private inArray = false;
  private depth = 0;
  private inString = false;
  private escaped = false;
  private start = -1;

  push(chunk: string): Record<string, unknown>[] {
    this.buffer += chunk;
    const found: Record<string, unknown>[] = [];
    for (; this.pos < this.buffer.length; this.pos++) {
      const c = this.buffer[this.pos];
      if (this.inString) {
        if (this.escaped) this.escaped = false;
        else if (c === "\\") this.escaped = true;
        else if (c === '"') this.inString = false;
        continue;
      }
      if (c === '"') {
        this.inString = true;
      } else if (!this.inArray) {
        if (c === "[") this.inArray = true;
      } else if (c === "{") {
        if (this.depth === 0) this.start = this.pos;
        this.depth++;
      } else if (c === "}") {
        this.depth--;
        if (this.depth === 0 && this.start >= 0) {
          try {
            found.push(JSON.parse(this.buffer.slice(this.start, this.pos + 1)));
          } catch {
            // Malformed item; skip it rather than abort the whole stream.
          }
          this.start = -1;
        }
      }
    }
    return found;
  }
}

/**
 * Generates a full itinerary, calling `onItem` for each item as it streams in.
 * Resolves with every item once the response completes.
 */
export const streamItinerary = async (
  tripData: TripData,
  onItem: (item: ItineraryItem) => void,
  signal?: AbortSignal,
): Promise<ItineraryItem[]> => {
  const pace = PACE_RULES[tripData.pace ?? "balanced"];
  const system = `You are an expert local travel planner. Plan a complete day-by-day itinerary.

Return JSON: {"sampleItinerary": [item, ...]} where each item is:
${ITEM_SCHEMA}

Rules:
- Cover EVERY day from 1 to ${tripData.days}, in chronological order (day, then time). Never stop early.
- Pace: ${pace}. Every day includes breakfast, lunch and dinner at named, real local places, plus an accommodation item in the evening.
${tripData.includeFlights ? `- Day 1 starts with a flight from the origin to the first destination. The last day ends with a return flight to the origin.` : "- Do not include flights."}
- Split days sensibly between the destinations in order, with a transport item when moving between cities.
- Match the interests and group type. Families: kid-friendly. Couples: romantic spots. Friends: social, lively.
- Order each day so places are geographically close to each other; avoid zig-zagging across the city.
- Use only real, specific places with accurate coordinates.
- Keep the total of estimatedCost within the budget.
- Output JSON only.`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: requestBody(
      [
        { role: "system", content: system },
        { role: "user", content: tripContext(tripData) },
      ],
      true,
    ),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`AI request failed (${res.status})`);

  const extractor = new ArrayItemExtractor();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const items: ItineraryItem[] = [];
  let pending = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      const event = JSON.parse(payload);
      if (event.error) throw new Error(event.error.message ?? "AI stream error");
      const content: string = event.choices?.[0]?.delta?.content ?? "";
      if (!content) continue;
      for (const raw of extractor.push(content)) {
        const item = normalizeItem(raw, items.at(-1)?.day ?? 1);
        if (item && item.day <= tripData.days) {
          items.push(item);
          onItem(item);
        }
      }
    }
  }

  if (items.length === 0) throw new Error("The AI returned an empty itinerary");
  return items;
};

const compactItem = (item: ItineraryItem, ref?: string) => ({
  ...(ref ? { ref } : {}),
  day: item.day,
  time: item.time,
  activity: item.activity,
  location: item.location,
  type: item.type,
  estimatedCost: item.estimatedCost,
});

/** Replaces every item on one day with a freshly planned day. */
export const regenerateDay = async (
  tripData: TripData,
  itinerary: ItineraryItem[],
  day: number,
  instruction?: string,
): Promise<ItineraryItem[]> => {
  const otherDays = itinerary
    .filter((i) => i.day !== day)
    .map((i) => `Day ${i.day}: ${i.activity}`);
  const current = itinerary.filter((i) => i.day === day);
  const system = `You are an expert local travel planner. Re-plan ONE day of an existing trip.

Return JSON: {"items": [item, ...]} where each item is:
${ITEM_SCHEMA}

Rules:
- Every item has "day": ${day}.
- Pace: ${PACE_RULES[tripData.pace ?? "balanced"]}. Include breakfast, lunch, dinner and an accommodation item.
- Do not repeat places already visited on other days.
- Keep flights and inter-city transport that exist today at the same time unless asked otherwise.
- Keep places geographically close together. Real places, accurate coordinates. JSON only.`;

  const user = `${tripContext(tripData)}

Other days already planned:
${otherDays.join("\n") || "(none)"}

Current plan for day ${day}:
${JSON.stringify(current.map((i) => compactItem(i)))}

${instruction ? `Request: ${instruction}` : "Give me a fresh, different plan for this day."}`;

  const data = await completeJson<{ items: Record<string, unknown>[] }>([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
  return (data.items ?? [])
    .map((raw) => normalizeItem({ ...raw, day }, day))
    .filter((i): i is ItineraryItem => i !== null);
};

export const SWAP_PRESETS = {
  cheaper: "Something cheaper or free, with a similar feel",
  indoor: "An indoor alternative, good for bad weather",
  closer: "Something closer to the other places planned that day",
  different: "Something completely different that suits the trip",
} as const;

/** Suggests a single replacement for an item, keeping its day and time slot. */
export const suggestAlternative = async (
  tripData: TripData,
  itinerary: ItineraryItem[],
  item: ItineraryItem,
  instruction: string,
): Promise<ItineraryItem> => {
  const sameDay = itinerary.filter((i) => i.day === item.day && i.id !== item.id);
  const system = `You are an expert local travel planner. Suggest ONE replacement for an itinerary item.

Return JSON: {"item": item} where item is:
${ITEM_SCHEMA}

Keep "day": ${item.day} and a time close to ${item.time}. Do not suggest a place already in the plan. Real place, accurate coordinates. JSON only.`;

  const user = `${tripContext(tripData)}

Rest of day ${item.day}:
${JSON.stringify(sameDay.map((i) => compactItem(i)))}

Replace: ${JSON.stringify(compactItem(item))}
Request: ${instruction}`;

  const data = await completeJson<{ item: Record<string, unknown> }>([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
  const next = normalizeItem({ ...data.item, day: item.day }, item.day);
  if (!next) throw new Error("No alternative found");
  return { ...next, id: item.id };
};

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatEditResult {
  reply: string;
  itinerary: ItineraryItem[];
  changed: number;
}

/**
 * Applies a natural-language edit ("add a rooftop bar on day 3") to the
 * itinerary. The model returns add / update / remove operations against
 * short refs, which are mapped back to real item ids here.
 */
export const chatEdit = async (
  tripData: TripData,
  itinerary: ItineraryItem[],
  message: string,
  history: ChatTurn[],
): Promise<ChatEditResult> => {
  const refs = new Map<string, ItineraryItem>();
  const listing = [...itinerary]
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))
    .map((item, i) => {
      const ref = `i${i + 1}`;
      refs.set(ref, item);
      return compactItem(item, ref);
    });

  const system = `You are a friendly travel assistant editing a user's itinerary.

Return JSON:
{
  "reply": string,                       // 1-3 friendly sentences describing what you changed, or answering the question
  "add": [item, ...],                    // new items
  "update": [{"ref": string, ...fields}],// changed fields of existing items
  "remove": [ref, ...]                   // refs of items to delete
}
New items follow:
${ITEM_SCHEMA}

Only change what the user asks for. If they only ask a question, answer it and leave add/update/remove empty.
Days range from 1 to ${tripData.days}. Real places, accurate coordinates. JSON only.`;

  const data = await completeJson<{
    reply?: string;
    add?: Record<string, unknown>[];
    update?: (Record<string, unknown> & { ref: string })[];
    remove?: string[];
  }>([
    { role: "system", content: system },
    {
      role: "user",
      content: `${tripContext(tripData)}\n\nCurrent itinerary:\n${JSON.stringify(listing)}`,
    },
    ...history.slice(-6),
    { role: "user", content: message },
  ]);

  const removeIds = new Set(
    (data.remove ?? []).map((ref) => refs.get(ref)?.id).filter(Boolean),
  );
  const updates = new Map<string, ItineraryItem>();
  for (const patch of data.update ?? []) {
    const original = refs.get(patch.ref);
    if (!original) continue;
    const merged = normalizeItem({ ...original, ...patch }, original.day);
    if (merged) {
      const locationChanged = merged.location !== original.location;
      updates.set(original.id, {
        ...original,
        ...merged,
        id: original.id,
        // Drop stale coordinates if the model moved the item without new ones.
        ...(locationChanged && patch.lat === undefined
          ? { lat: undefined, lng: undefined }
          : {}),
      });
    }
  }
  const added = (data.add ?? [])
    .map((raw) => normalizeItem(raw, 1))
    .filter((i): i is ItineraryItem => i !== null && i.day <= tripData.days);

  const next = [
    ...itinerary
      .filter((i) => !removeIds.has(i.id))
      .map((i) => updates.get(i.id) ?? i),
    ...added,
  ];

  return {
    reply: data.reply ?? "Done!",
    itinerary: next,
    changed: removeIds.size + updates.size + added.length,
  };
};
