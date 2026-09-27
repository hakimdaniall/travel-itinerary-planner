import { useMemo, useState } from "react";
import type { ItineraryItem } from "@/types/trip";
import { formatDayDate, groupByDay, itemMinutes, itemTypeMeta } from "@/lib/itinerary";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AddEditActivityDialog from "@/components/AddEditActivityDialog";
import { useTripContext } from "./TripContext";
import { dayColor } from "./TripMap";

const PX_PER_MIN = 1.1;
const MIN_BLOCK = 30;

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

interface Placed {
  item: ItineraryItem;
  start: number;
  end: number;
  lane: number;
  lanes: number;
}

/** Assigns overlapping items to side-by-side lanes. */
const layoutDay = (items: ItineraryItem[]): Placed[] => {
  const placed: Placed[] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((p) => p.lane + 1));
    cluster.forEach((p) => (p.lanes = lanes));
    cluster = [];
  };

  for (const item of items) {
    const start = toMinutes(item.time);
    const end = start + Math.max(itemMinutes(item), MIN_BLOCK / PX_PER_MIN);
    if (start >= clusterEnd) flush();
    const used = new Set(cluster.filter((p) => p.end > start).map((p) => p.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    const p = { item, start, end, lane, lanes: 1 };
    cluster.push(p);
    placed.push(p);
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();
  return placed;
};

const TimelineView = () => {
  const { trip, actions } = useTripContext();
  const { tripData } = trip;
  const [editing, setEditing] = useState<ItineraryItem | null>(null);

  const days = useMemo(
    () => groupByDay(trip.itinerary, tripData.days).map(layoutDay),
    [trip.itinerary, tripData.days],
  );

  const all = days.flat();
  const rangeStart = Math.min(7 * 60, ...all.map((p) => Math.floor(p.start / 60) * 60));
  const rangeEnd = Math.min(
    24 * 60 + 120,
    Math.max(22 * 60, ...all.map((p) => Math.ceil(p.end / 60) * 60)),
  );
  const hours = Array.from(
    { length: (rangeEnd - rangeStart) / 60 + 1 },
    (_, i) => rangeStart / 60 + i,
  );
  const height = (rangeEnd - rangeStart) * PX_PER_MIN;

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <div className="flex min-w-max">
        <div className="sticky left-0 z-10 w-14 shrink-0 border-r bg-card">
          <div className="h-12 border-b" />
          <div className="relative" style={{ height }}>
            {hours.map((h) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
                style={{ top: (h * 60 - rangeStart) * PX_PER_MIN }}
              >
                {String(h % 24).padStart(2, "0")}:00
              </span>
            ))}
          </div>
        </div>

        {days.map((placed, index) => {
          const day = index + 1;
          return (
            <div key={day} className="w-56 shrink-0 border-r last:border-r-0">
              <div className="flex h-12 items-center gap-2 border-b px-3">
                <span
                  className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: dayColor(day) }}
                >
                  {day}
                </span>
                <span className="text-sm font-semibold">{formatDayDate(tripData, day)}</span>
              </div>
              <div className="relative" style={{ height }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-dashed border-border/60"
                    style={{ top: (h * 60 - rangeStart) * PX_PER_MIN }}
                  />
                ))}
                {placed.map(({ item, start, end, lane, lanes }) => {
                  const meta = itemTypeMeta(item.type);
                  const Icon = meta.icon;
                  const blockHeight = Math.max(MIN_BLOCK, (end - start) * PX_PER_MIN - 2);
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => actions && setEditing(item)}
                          className="absolute overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-xs shadow-sm transition hover:z-10 hover:shadow-md"
                          style={{
                            top: (start - rangeStart) * PX_PER_MIN + 1,
                            height: blockHeight,
                            left: `calc(${(lane / lanes) * 100}% + 4px)`,
                            width: `calc(${100 / lanes}% - 8px)`,
                            borderColor: meta.color,
                            background: `${meta.color}1f`,
                          }}
                        >
                          <span className="flex items-center gap-1 font-semibold leading-tight">
                            <Icon className="h-3 w-3 shrink-0" style={{ color: meta.color }} />
                            <span className="truncate">{item.activity}</span>
                          </span>
                          {blockHeight > 40 && (
                            <span className="block truncate text-muted-foreground">
                              {item.time} · {item.location}
                            </span>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="font-semibold">{item.activity}</p>
                        <p className="text-xs opacity-80">
                          {item.time} · {itemMinutes(item)} min · {item.location}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {actions && editing && (
        <AddEditActivityDialog
          day={editing.day}
          item={editing}
          currency={tripData.currency}
          onSave={actions.upsertItem}
          isEdit
          trigger={null}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
};

export default TimelineView;
