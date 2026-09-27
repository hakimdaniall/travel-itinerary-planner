import { memo, useState } from "react";
import {
  ArrowRightLeft,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import type { ItineraryItem } from "@/types/trip";
import { destinationForDay, formatMoney, itemTypeMeta } from "@/lib/itinerary";
import { googleMapsUrl } from "@/lib/geo";
import { usePlaceInfo, useCityCoords } from "@/hooks/useTripMedia";
import { SWAP_PRESETS, suggestAlternative } from "@/api/groqApi";
import { useTripStore } from "@/store/tripStore";
import AddEditActivityDialog from "@/components/AddEditActivityDialog";
import { useTripContext } from "./TripContext";

interface ActivityCardProps {
  item: ItineraryItem;
  /** Smaller layout for kanban columns. */
  compact?: boolean;
  className?: string;
}

const ActivityCard = ({ item, compact, className }: ActivityCardProps) => {
  const { trip, actions, activeId, setActiveId } = useTripContext();
  const { tripData } = trip;
  const city = destinationForDay(tripData, item.day);
  const { data: place } = usePlaceInfo(item, city);
  const { data: cityCoords } = useCityCoords(city);
  const [swapping, setSwapping] = useState(false);
  const [editing, setEditing] = useState(false);
  const meta = itemTypeMeta(item.type);
  const Icon = meta.icon;
  const active = activeId === item.id;

  const swap = async (instruction: string) => {
    if (!actions) return;
    setSwapping(true);
    try {
      const latest = useTripStore.getState().trips[trip.id];
      const next = await suggestAlternative(
        latest.tripData,
        latest.itinerary,
        item,
        instruction,
      );
      actions.replaceItem(next);
    } catch {
      toast.error("Couldn't find an alternative. Please try again.");
    } finally {
      setSwapping(false);
    }
  };

  const thumb = place?.thumbnail ? (
    <img
      src={place.thumbnail}
      alt=""
      loading="lazy"
      className={cn("rounded-lg object-cover shrink-0", compact ? "h-12 w-12" : "h-20 w-20")}
    />
  ) : (
    <div
      className={cn(
        "rounded-lg grid place-items-center shrink-0",
        compact ? "h-12 w-12" : "h-20 w-20",
      )}
      style={{ background: `${meta.color}1a`, color: meta.color }}
    >
      <Icon className={compact ? "h-5 w-5" : "h-7 w-7"} />
    </div>
  );

  return (
    <div
      onMouseEnter={() => setActiveId(item.id)}
      onMouseLeave={() => setActiveId(null)}
      className={cn(
        "group relative flex gap-3 rounded-xl border bg-card p-3 transition-all",
        active ? "border-primary shadow-md" : "hover:shadow-sm",
        className,
      )}
    >
      {swapping && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-background/70 backdrop-blur-[1px]">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin" /> Finding something better…
          </span>
        </div>
      )}

      {place?.extract ? (
        <HoverCard openDelay={300}>
          <HoverCardTrigger asChild>
            <a href={place.url} target="_blank" rel="noopener noreferrer">
              {thumb}
            </a>
          </HoverCardTrigger>
          <HoverCardContent className="w-72 text-sm" side="right">
            {place.thumbnail && (
              <img src={place.thumbnail} alt="" className="mb-2 h-32 w-full rounded-md object-cover" />
            )}
            <p className="font-semibold mb-1">{place.title}</p>
            <p className="text-muted-foreground line-clamp-4">{place.extract}</p>
            <p className="mt-2 text-xs text-muted-foreground">From Wikipedia</p>
          </HoverCardContent>
        </HoverCard>
      ) : (
        thumb
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium text-foreground">
            <Clock className="h-3 w-3" />
            {item.time}
          </span>
          {!compact && (
            <Badge variant="outline" className={cn("px-1.5 py-0 text-[11px]", meta.badge)}>
              {meta.label}
            </Badge>
          )}
          <span className="ml-auto font-medium text-foreground">
            {item.estimatedCost > 0 ? formatMoney(tripData.currency, item.estimatedCost) : "Free"}
          </span>
        </div>
        <h4 className={cn("font-semibold leading-snug mt-1", compact ? "text-sm" : "text-base")}>
          {item.activity}
        </h4>
        <a
          href={googleMapsUrl(item.location, city)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary w-fit max-w-full"
        >
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{item.location}</span>
        </a>
        {item.notes && !compact && (
          <p className="mt-1.5 text-xs text-muted-foreground italic">💡 {item.notes}</p>
        )}
      </div>

      {actions && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 -mr-1 -mt-1 opacity-60 group-hover:opacity-100"
                aria-label="Activity options"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sparkles className="h-4 w-4 mr-2 text-primary" /> Swap with AI
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-60">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Replace with…
                  </DropdownMenuLabel>
                  <DropdownMenuItem onSelect={() => swap(SWAP_PRESETS.cheaper)}>
                    💸 Something cheaper
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => swap(SWAP_PRESETS.indoor)}>
                    ☔ An indoor option
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => swap(SWAP_PRESETS.closer)}>
                    📍 Something closer
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => swap(SWAP_PRESETS.different)}>
                    🎲 Surprise me
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {tripData.days > 1 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ArrowRightLeft className="h-4 w-4 mr-2" /> Move to day
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
                    {Array.from({ length: tripData.days }, (_, i) => i + 1)
                      .filter((d) => d !== item.day)
                      .map((d) => (
                        <DropdownMenuItem key={d} onSelect={() => actions.moveItemToDay(item.id, d)}>
                          Day {d}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuItem asChild>
                <a href={googleMapsUrl(item.location, city)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> Open in Google Maps
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => actions.removeItem(item.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AddEditActivityDialog
            day={item.day}
            item={item}
            currency={tripData.currency}
            onSave={actions.upsertItem}
            isEdit
            near={cityCoords ?? undefined}
            trigger={null}
            open={editing}
            onOpenChange={setEditing}
          />
        </>
      )}
    </div>
  );
};

export default memo(ActivityCard);
