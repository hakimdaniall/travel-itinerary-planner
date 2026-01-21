// Analytics Service for tracking trip events

interface TrackEventParams {
  eventType: "generated" | "saved" | "exported";
  tripDestination?: string;
  tripDays?: number;
  tripBudget?: number;
  creatorName?: string;
}

interface AnalyticsStats {
  generated: number;
  saved: number;
  exported: number;
}

interface TripData {
  event_type: "generated" | "saved" | "exported";
  trip_destination: string;
  trip_days: number;
  trip_budget: number;
  creator_name: string;
  created_at: string;
}

interface AnalyticsResponse {
  success: boolean;
  period: string;
  stats: AnalyticsStats;
  total: number;
  daily: Array<{
    date: string;
    event_type: string;
    count: string;
  }>;
  trips: TripData[];
}

class AnalyticsService {
  private baseUrl: string;
  private sessionId: string;

  constructor() {
    // Use production URL in production, otherwise use Netlify dev URL
    this.baseUrl = import.meta.env.PROD
      ? "/.netlify/functions"
      : "http://localhost:8888/.netlify/functions";

    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem("analytics_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem("analytics_session_id", sessionId);
    }
    return sessionId;
  }

  async trackEvent(params: TrackEventParams): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/track-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...params,
          sessionId: this.sessionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to track event:", error);
      }
    } catch (error) {
      // Silently fail - we don't want analytics to break the user experience
      console.error("Analytics tracking error:", error);
    }
  }

  async trackGenerated(
    tripDestination: string,
    tripDays: number,
    tripBudget: number,
  ): Promise<void> {
    return this.trackEvent({
      eventType: "generated",
      tripDestination,
      tripDays,
      tripBudget,
    });
  }

  async trackSaved(
    tripDestination: string,
    tripDays: number,
    tripBudget: number,
    creatorName?: string,
  ): Promise<void> {
    return this.trackEvent({
      eventType: "saved",
      tripDestination,
      tripDays,
      tripBudget,
      creatorName,
    });
  }

  async trackExported(
    tripDestination: string,
    tripDays: number,
    tripBudget: number,
  ): Promise<void> {
    return this.trackEvent({
      eventType: "exported",
      tripDestination,
      tripDays,
      tripBudget,
    });
  }

  async getAnalytics(days: number = 30): Promise<AnalyticsResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/get-analytics?days=${days}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      return null;
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
