const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const fetchItineraryFromGroq = async (tripData) => {
  const systemPrompt = `
  You are a travel itinerary planner. Given TripData, return a complete daily itinerary as a JSON array named sampleItinerary, with structured items covering the full day (from morning to evening) for each day of the trip.

  TripData includes a "fromDestination" (origin city), a list of "destinations", a start and end date, and a total budget with currency.

  Each itinerary item must follow this format:
  {
    "id": string,
    "day": number,
    "time": string, // Format must be HH:mm (24-hour clock)
    "activity": string,
    "location": string,
    "estimatedCost": number,
    "type": "flight" | "accommodation" | "activity" | "meal" | "transport"
  }

  Rules:
  - Day 1 must begin with a flight from "fromDestination" to the first "destination" in the list.
  - All time values must be realistic and in HH:mm format (e.g., "08:00", "13:30").
  - Each day must include several structured activities: meals (breakfast, lunch, dinner), local activities, transport, and accommodations.
  - Include only real, local experiences and locations for each destination.
  - Stay within the provided total budget.
  - Include flights (if "includeFlights" is true), accommodations, meals, activities, and transport.
  - Return only valid, parsable JSON with no extra text or explanation.
  `;


  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      response_format: {
        "type": "json_object"
    },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(tripData) }
      ]
    })
  });

  if (!res.ok) {
    throw new Error('Failed to fetch itinerary');
  }

  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return parsed.sampleItinerary;
};
