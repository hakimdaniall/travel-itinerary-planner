const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;

export const createPlan = async (payload) => {
  const res = await fetch(`${STRAPI_URL}/plans/create-with-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('Failed to fetch itinerary');
  }

  const data = await res.json();
  return data.plan;
};
