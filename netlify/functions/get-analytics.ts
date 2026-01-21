import { Handler } from "@netlify/functions";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only allow GET
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Helper function to mask creator name (backend masking)
  const maskCreatorName = (name: string | null): string => {
    if (!name || name.trim() === "") return "Anonymous";

    const trimmedName = name.trim();
    if (trimmedName.length <= 2) {
      return trimmedName[0] + "*";
    } else if (trimmedName.length <= 4) {
      return trimmedName.substring(0, 2) + "**";
    } else {
      const visibleChars = Math.min(3, Math.floor(trimmedName.length / 3));
      const maskedLength = trimmedName.length - visibleChars;
      return (
        trimmedName.substring(0, visibleChars) +
        "*".repeat(Math.min(maskedLength, 8))
      );
    }
  };

  try {
    const { days = 30 } = event.queryStringParameters || {};

    // Get overall statistics
    const statsQuery = `
      SELECT 
        event_type,
        COUNT(*) as count
      FROM trip_analytics
      WHERE created_at >= NOW() - INTERVAL '${parseInt(days as string)} days'
      GROUP BY event_type
    `;

    const statsResult = await pool.query(statsQuery);

    const stats = {
      generated: 0,
      saved: 0,
      exported: 0,
    };

    statsResult.rows.forEach((row) => {
      stats[row.event_type as keyof typeof stats] = parseInt(row.count);
    });

    // Get daily breakdown
    const dailyQuery = `
      SELECT 
        DATE(created_at) as date,
        event_type,
        COUNT(*) as count
      FROM trip_analytics
      WHERE created_at >= NOW() - INTERVAL '${parseInt(days as string)} days'
      GROUP BY DATE(created_at), event_type
      ORDER BY date DESC, event_type
    `;

    const dailyResult = await pool.query(dailyQuery);

    // Get total count
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM trip_analytics
      WHERE created_at >= NOW() - INTERVAL '${parseInt(days as string)} days'
    `;

    const totalResult = await pool.query(totalQuery);

    // Get detailed trip data with masked creator names
    const tripsQuery = `
      SELECT 
        event_type,
        trip_destination,
        trip_days,
        trip_budget,
        creator_name,
        created_at
      FROM trip_analytics
      WHERE created_at >= NOW() - INTERVAL '${parseInt(days as string)} days'
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const tripsResult = await pool.query(tripsQuery);

    // Mask creator names in backend
    const trips = tripsResult.rows.map((row) => ({
      event_type: row.event_type,
      trip_destination: row.trip_destination,
      trip_days: row.trip_days,
      trip_budget: row.trip_budget,
      creator_name: maskCreatorName(row.creator_name),
      created_at: row.created_at,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        period: `${days} days`,
        stats,
        total: parseInt(totalResult.rows[0].total),
        daily: dailyResult.rows,
        trips,
      }),
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to fetch analytics",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
