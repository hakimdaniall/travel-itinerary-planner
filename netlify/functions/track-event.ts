import { Handler } from "@netlify/functions";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

interface TrackEventBody {
  eventType: "generated" | "saved" | "exported";
  tripDestination?: string;
  tripDays?: number;
  tripBudget?: number;
  creatorName?: string;
  sessionId?: string;
}

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body: TrackEventBody = JSON.parse(event.body || "{}");
    const {
      eventType,
      tripDestination,
      tripDays,
      tripBudget,
      creatorName,
      sessionId,
    } = body;

    // Validate event type
    if (!eventType || !["generated", "saved", "exported"].includes(eventType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid event type" }),
      };
    }

    // Get user agent from headers
    const userAgent = event.headers["user-agent"] || "unknown";

    // Insert into database
    const query = `
      INSERT INTO trip_analytics 
        (event_type, trip_destination, trip_days, trip_budget, creator_name, user_agent, session_id)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
    `;

    const values = [
      eventType,
      tripDestination || null,
      tripDays || null,
      tripBudget || null,
      creatorName || null,
      userAgent,
      sessionId || null,
    ];

    const result = await pool.query(query, values);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        id: result.rows[0].id,
        createdAt: result.rows[0].created_at,
      }),
    };
  } catch (error) {
    console.error("Error tracking event:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to track event",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
