import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ItineraryItem, TripData } from "@/types/trip";
import { itemTypeMeta } from "@/lib/itinerary";
import { useCityCoords } from "@/hooks/useTripMedia";
import { TripCover } from "./TripHero";
import TripMap from "./TripMap";

const MESSAGES = [
  "Scouting the best breakfast spots…",
  "Checking which views are worth the climb…",
  "Asking locals where they actually eat…",
  "Plotting routes that don't zig-zag…",
  "Squeezing in one more hidden gem…",
  "Balancing the budget…",
];

const GeneratingView = ({
  tripData,
  items,
}: {
  tripData: TripData;
  items: ItineraryItem[];
}) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const { data: center } = useCityCoords(tripData.destinations[0]);
  const currentDay = items.at(-1)?.day ?? 0;
  const progress = Math.min(100, (Math.max(0, currentDay - 1) / tripData.days) * 100 + (items.length ? 100 / tripData.days / 2 : 0));

  useEffect(() => {
    const timer = setInterval(() => setMessageIndex((i) => (i + 1) % MESSAGES.length), 2600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <TripCover destination={tripData.destinations[0]} className="rounded-3xl text-white">
        <div className="relative flex min-h-[220px] flex-col justify-end p-6 sm:p-8">
          <p className="flex items-center gap-2 text-sm font-medium text-white/85">
            <Sparkles className="h-4 w-4 animate-pulse" /> Building your itinerary
          </p>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">
            {tripData.destinations.join(" → ")}
          </h1>
          <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/25">
            <motion.div
              className="h-full rounded-full bg-white"
              animate={{ width: `${Math.max(4, progress)}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-sm text-white/80">
            {currentDay > 0 ? `Planning day ${currentDay} of ${tripData.days}` : "Warming up…"}
          </p>
        </div>
      </TripCover>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 text-muted-foreground"
            >
              {MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {items.slice(-7).reverse().map((item) => {
                const meta = itemTypeMeta(item.type);
                const Icon = meta.icon;
                return (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -24, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3"
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                      style={{ background: `${meta.color}1a`, color: meta.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.activity}</p>
                      <p className="text-xs text-muted-foreground">
                        Day {item.day} · {item.time} · {item.location}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {items.length === 0 &&
              Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="h-[62px] animate-pulse rounded-xl bg-muted" />
              ))}
          </ul>
        </div>
        <div className="h-72 overflow-hidden rounded-2xl border lg:h-[460px]">
          <TripMap items={items} fallbackCenter={center ?? undefined} />
        </div>
      </div>
    </div>
  );
};

export default GeneratingView;
