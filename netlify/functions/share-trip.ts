import { Handler } from "@netlify/functions";
import { Pool } from "pg";
import { randomBytes } from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const MAX_BYTES = 512 * 1024;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Content-Type": "application/json",
};

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});

// URL-safe short id, e.g. "k3J9xQ2mPa"
const shortId = (bytes: number) =>
  randomBytes(bytes).toString("base64url").slice(0, Math.ceil(bytes * 1.3));

/**
 * GET  ?id=<shareId>             → { trip }
 * POST { trip }                  → { id, token }   creates a new share link
 * PUT  { id, token, trip }       → { id }          updates a link you created
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  try {
    if (event.httpMethod === "GET") {
      const id = event.queryStringParameters?.id;
      if (!id) return json(400, { error: "Missing id" });
      const result = await pool.query(
        "SELECT data FROM shared_trips WHERE id = $1",
        [id],
      );
      if (result.rowCount === 0) return json(404, { error: "Trip not found" });
      return json(200, { trip: result.rows[0].data });
    }

    if (event.body && event.body.length > MAX_BYTES) {
      return json(413, { error: "Trip is too large to share" });
    }
    const body = JSON.parse(event.body || "{}");
    if (!body.trip?.tripData || !Array.isArray(body.trip?.itinerary)) {
      return json(400, { error: "Invalid trip" });
    }

    if (event.httpMethod === "POST") {
      const id = shortId(8);
      const token = shortId(24);
      await pool.query(
        "INSERT INTO shared_trips (id, edit_token, data) VALUES ($1, $2, $3)",
        [id, token, body.trip],
      );
      return json(200, { id, token });
    }

    if (event.httpMethod === "PUT") {
      const result = await pool.query(
        "UPDATE shared_trips SET data = $3, updated_at = NOW() WHERE id = $1 AND edit_token = $2",
        [body.id, body.token, body.trip],
      );
      if (result.rowCount === 0) return json(403, { error: "Not allowed" });
      return json(200, { id: body.id });
    }

    return json(405, { error: "Method not allowed" });
  } catch (error) {
    console.error("share-trip error:", error);
    return json(500, {
      error: "Failed to share trip",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
