import { Fragment, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCityCoords, useTripWeather } from "@/hooks/useTripMedia";
import {
  destinationForDay,
  formatDayDate,
  formatMoney,
  groupByDay,
} from "@/lib/itinerary";
import { describeWeather } from "@/lib/weather";
import AddEditActivityDialog from "@/components/AddEditActivityDialog";
import ActivityCard from "./ActivityCard";
import TravelLeg from "./TravelLeg";
import TripMap, { dayColor } from "./TripMap";
import { DayMenu, WeatherBadge } from "./DayTools";
import { useTripContext } from "./TripContext";

const DaySection = ({
  day,
  weather,
}: {
  day: number;
  weather?: ReturnType<typeof useTripWeather>[number];
}) => {
  const { trip, actions } = useTripContext();
  const { tripData } = trip;
  const items = useMemo(
    () => groupByDay(trip.itinerary, tripData.days)[day - 1] ?? [],
    [trip.itinerary, tripData.days, day],
  );
  const city = destinationForDay(tripData, day);
  const { data: cityCoords } = useCityCoords(city);
  const [busy, setBusy] = useState(false);
  const cost = items.reduce((sum, i) => sum + i.estimatedCost, 0);

  return (
    <section className="relative">
      <div className="flex items-center gap-3 mb-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
          style={{ background: dayColor(day) }}
        >
          {day}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-semibold leading-tight">
            {formatDayDate(tripData, day)}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {city}
            </span>
            <span>· {items.length} stops</span>
            {cost > 0 && <span>· {formatMoney(tripData.currency, cost)}</span>}
          </p>
        </div>
        <WeatherBadge weather={weather} />
        <DayMenu day={day} onBusyChange={setBusy} />
      </div>

      <div className={cn("transition-opacity", busy && "opacity-40 pointer-events-none")}>
        {items.length === 0 && (
          <p className="ml-12 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nothing planned yet. Add an activity or ask the AI to plan this day.
          </p>
        )}
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <Fragment key={item.id}>
              {i > 0 && <TravelLeg from={items[i - 1]} to={item} />}
              <motion.div
                id={`item-${item.id}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ActivityCard item={item} />
              </motion.div>
            </Fragment>
          ))}
        </AnimatePresence>
        {actions && (
          <AddEditActivityDialog
            day={day}
            currency={tripData.currency}
            onSave={actions.upsertItem}
            near={cityCoords ?? undefined}
            trigger={
              <Button variant="ghost" size="sm" className="mt-2 w-full border border-dashed text-muted-foreground">
                <Plus className="h-4 w-4 mr-1" /> Add activity
              </Button>
            }
          />
        )}
      </div>
      {busy && (
        <div className="absolute inset-0 top-12 grid place-items-start justify-center pt-10">
          <span className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium shadow-lg border">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Re-planning Day {day}…
          </span>
        </div>
      )}
    </section>
  );
};

const PlanView = () => {
  const { trip, activeId, setActiveId } = useTripContext();
  const { tripData } = trip;
  const weather = useTripWeather(tripData);
  const [selected, setSelected] = useState<number | "all">(1);
  const { data: firstCity } = useCityCoords(tripData.destinations[0]);

  const day = selected === "all" ? "all" : Math.min(selected, tripData.days);
  const days = day === "all" ? Array.from({ length: tripData.days }, (_, i) => i + 1) : [day];
  const mapItems = useMemo(
    () => (day === "all" ? trip.itinerary : trip.itinerary.filter((i) => i.day === day)),
    [trip.itinerary, day],
  );
  const { data: dayCity } = useCityCoords(
    day === "all" ? undefined : destinationForDay(tripData, day),
  );

  const focusItem = (id: string) => {
    setActiveId(id);
    document.getElementById(`item-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div>
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
        <DayChip active={day === "all"} onClick={() => setSelected("all")}>
          All days
        </DayChip>
        {Array.from({ length: tripData.days }, (_, i) => i + 1).map((d) => {
          const w = weather[d - 1];
          return (
            <DayChip key={d} active={day === d} onClick={() => setSelected(d)} color={dayColor(d)}>
              <span className="font-semibold">Day {d}</span>
              <span className="opacity-70">{formatDayDate(tripData, d).split(", ")[1]}</span>
              {w && <span>{describeWeather(w.code).icon}</span>}
            </DayChip>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-10">
          {days.map((d) => (
            <DaySection key={d} day={d} weather={weather[d - 1]} />
          ))}
        </div>
        <div className="order-first lg:order-none">
          <div className="h-64 overflow-hidden rounded-2xl border shadow-sm sm:h-80 lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)]">
            <TripMap
              items={mapItems}
              activeId={activeId}
              onSelect={focusItem}
              fallbackCenter={(dayCity ?? firstCity) || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const DayChip = ({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
      active ? "border-transparent text-white shadow" : "bg-card hover:border-primary/40",
    )}
    style={active ? { background: color ?? "hsl(var(--primary))" } : undefined}
  >
    {children}
  </button>
);

export default PlanView;
