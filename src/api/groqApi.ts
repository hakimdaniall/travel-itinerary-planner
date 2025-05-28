const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const fetchItineraryFromGroq = async (tripData) => {
  const systemPrompt = `
    You are a travel itinerary planner. Given TripData, return a complete daily itinerary as a JSON array named sampleItinerary, with structured items covering the full day (from morning to evening) for each day of the trip.

    Each item must follow this format:
    {
      "id": string,
      "day": number,
      "time": string, // Format must be HH:mm (24-hour clock)
      "activity": string,
      "location": string,
      "estimatedCost": number,
      "type": "flight" | "accommodation" | "activity" | "meal" | "transport"
    }

    Ensure:
    - All time values are realistic and in HH:mm format (e.g., "08:00", "13:30").
    - Each day includes multiple itinerary entries from morning to night (e.g., breakfast, 2–3 activities, transport, lunch, dinner, check-in).
    - Total costs stay within the trip's stated budget.
    - Use real places and experiences.
    - Include flights (if specified), accommodations, meals, activities, and transport.
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
