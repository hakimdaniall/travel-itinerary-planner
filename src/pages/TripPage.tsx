import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import TripWorkspace from "@/components/trip/TripWorkspace";
import GeneratingView from "@/components/trip/GeneratingView";
import { useTrip, useTripStore } from "@/store/tripStore";
import { useTripActions } from "@/hooks/useTripActions";
import { useGeocodeItinerary } from "@/hooks/useTripMedia";
import { streamItinerary } from "@/api/groqApi";
import { analyticsService } from "@/api/analyticsService";
import type { ItineraryItem } from "@/types/trip";

const celebrate = () => {
  const burst = (x: number) =>
    confetti({ particleCount: 90, spread: 75, startVelocity: 45, origin: { x, y: 0.6 } });
  burst(0.25);
  setTimeout(() => burst(0.75), 180);
};

const TripPage = () => {
  const { id = "" } = useParams();
  const trip = useTrip(id);
  const actions = useTripActions(id);
  const [searchParams, setSearchParams] = useSearchParams();
  const [generating, setGenerating] = useState(false);
  const [streamed, setStreamed] = useState<ItineraryItem[]>([]);
  const [failed, setFailed] = useState(false);
  const controller = useRef<AbortController | null>(null);

  useGeocodeItinerary(generating ? undefined : id);

  const generate = async () => {
    const current = useTripStore.getState().trips[id];
    if (!current) return;
    controller.current?.abort();
    controller.current = new AbortController();
    setFailed(false);
    setGenerating(true);
    setStreamed([]);
    const collected: ItineraryItem[] = [];
    try {
      await streamItinerary(
        current.tripData,
        (item) => {
          collected.push(item);
          setStreamed([...collected]);
        },
        controller.current.signal,
      );
      useTripStore.getState().setItinerary(id, collected);
      celebrate();
      toast.success("Your trip is ready!", {
        description: "Tweak anything: drag cards, swap activities, or ask the AI.",
      });
      analyticsService
        .trackGenerated(current.tripData.destinations[0] ?? "Unknown", current.tripData.days, current.tripData.budget)
        .catch(() => {});
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      console.error("Error generating itinerary:", error);
      // Keep whatever arrived before the failure; it's still useful.
      if (collected.length > 0) useTripStore.getState().setItinerary(id, collected);
      setFailed(true);
      toast.error("The AI couldn't finish your itinerary", {
        description: collected.length ? "We kept what it planned so far." : "Please try again.",
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("generate") === "1" && trip) {
      setSearchParams({}, { replace: true });
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => controller.current?.abort(), []);

  if (!trip) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-display text-3xl font-semibold mb-2">Trip not found</h1>
          <p className="text-muted-foreground mb-6">
            It may have been deleted, or it was created in another browser.
          </p>
          <Button asChild>
            <Link to="/">Back to my trips</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {generating ? (
          <GeneratingView tripData={trip.tripData} items={streamed} />
        ) : (
          <>
            {(failed || trip.itinerary.length === 0) && (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-dashed bg-card p-5 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="font-semibold">
                    {failed ? "Generation didn't finish" : "Your itinerary is empty"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add activities day by day, or let the AI draft the whole trip.
                  </p>
                </div>
                <Button onClick={generate}>
                  {failed ? <RotateCcw className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {failed ? "Try again" : "Generate with AI"}
                </Button>
              </div>
            )}
            <TripWorkspace trip={trip} actions={actions} />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default TripPage;
