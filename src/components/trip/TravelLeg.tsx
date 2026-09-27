import { AlertTriangle, Car, Footprints, Plane } from "lucide-react";
import type { ItineraryItem } from "@/types/trip";
import { estimateLeg, formatDistance, formatMinutes, hasCoords } from "@/lib/geo";
import { itemMinutes } from "@/lib/itinerary";
import { cn } from "@/lib/utils";

const ICONS = { walk: Footprints, drive: Car, fly: Plane };
const LABELS = { walk: "walk", drive: "by car / transit", fly: "flight" };

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Estimated travel between two consecutive items, with a warning when the gap is too tight. */
const TravelLeg = ({ from, to }: { from: ItineraryItem; to: ItineraryItem }) => {
  if (!hasCoords(from) || !hasCoords(to) || from.type === "flight" || to.type === "flight") {
    return <div className="ml-10 h-3 border-l-2 border-dashed border-border" />;
  }
  const leg = estimateLeg(from, to);
  if (leg.km < 0.05) {
    return <div className="ml-10 h-3 border-l-2 border-dashed border-border" />;
  }
  const Icon = ICONS[leg.mode];
  // Only flag clearly unrealistic gaps: less than the travel time plus a short
  // visit between the two start times. Default durations are too rough to be stricter.
  const startGap = toMinutes(to.time) - toMinutes(from.time);
  const minVisit = Math.min(itemMinutes(from), 15);
  const tight = leg.mode !== "fly" && leg.minutes >= 15 && startGap < leg.minutes + minVisit;
  const far = leg.mode === "drive" && leg.km > 40;

  return (
    <div className="ml-10 flex items-center gap-2 border-l-2 border-dashed border-border py-1.5 pl-4 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span>
        ~{formatMinutes(leg.minutes)} {LABELS[leg.mode]} · {formatDistance(leg.km)}
      </span>
      {(tight || far) && (
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
            "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
          )}
          title={
            far
              ? "This is a long trip within one day"
              : "The previous stop ends too late to get here on time"
          }
        >
          <AlertTriangle className="h-3 w-3" />
          {far ? "Long hop" : "Tight"}
        </span>
      )}
    </div>
  );
};

export default TravelLeg;
