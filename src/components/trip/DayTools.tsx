import { useState } from "react";
import { ArrowRightLeft, Loader2, MoreVertical, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import type { DayWeather } from "@/lib/weather";
import { describeWeather } from "@/lib/weather";
import { regenerateDay } from "@/api/groqApi";
import { useTripStore } from "@/store/tripStore";
import { useTripContext } from "./TripContext";

export const WeatherBadge = ({ weather }: { weather?: DayWeather }) => {
  if (!weather) return null;
  const { icon, label } = describeWeather(weather.code);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          <span>{icon}</span>
          {weather.max}°<span className="text-muted-foreground">/{weather.min}°</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {weather.typical ? " · typical for this date (last year)" : " · forecast"}
      </TooltipContent>
    </Tooltip>
  );
};

const IDEAS = [
  "Make it more relaxed",
  "Focus on food",
  "Rainy day plan, mostly indoors",
  "Cheaper, lots of free things",
  "Add some nightlife",
];

/** Menu for a day: AI re-plan, move and delete. Also owns the loading overlay state. */
export const DayMenu = ({
  day,
  onBusyChange,
}: {
  day: number;
  onBusyChange?: (busy: boolean) => void;
}) => {
  const { trip, actions } = useTripContext();
  const [promptOpen, setPromptOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);

  if (!actions) return null;

  const run = async (text?: string) => {
    setPromptOpen(false);
    setBusy(true);
    onBusyChange?.(true);
    try {
      const latest = useTripStore.getState().trips[trip.id];
      const items = await regenerateDay(latest.tripData, latest.itinerary, day, text);
      if (items.length === 0) throw new Error("empty");
      actions.replaceDay(day, items);
    } catch {
      toast.error(`Couldn't re-plan Day ${day}. Please try again.`);
    } finally {
      setBusy(false);
      onBusyChange?.(false);
      setInstruction("");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Day ${day} options`}
            disabled={busy}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => run()}>
            <Sparkles className="h-4 w-4 mr-2 text-primary" /> Regenerate this day
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPromptOpen(true)}>
            <Wand2 className="h-4 w-4 mr-2 text-primary" /> Re-plan with instructions…
          </DropdownMenuItem>
          {trip.tripData.days > 1 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowRightLeft className="h-4 w-4 mr-2" /> Move day to
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
                  {Array.from({ length: trip.tripData.days }, (_, i) => i + 1)
                    .filter((d) => d !== day)
                    .map((d) => (
                      <DropdownMenuItem key={d} onSelect={() => actions.moveDayTo(day, d)}>
                        Day {d}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete day
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Re-plan Day {day}</DialogTitle>
            <DialogDescription>Tell the AI what you'd like this day to feel like.</DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            rows={3}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Sleep in, then beaches and a nice seafood dinner"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && instruction.trim()) {
                e.preventDefault();
                run(instruction.trim());
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            {IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => setInstruction(idea)}
                className="rounded-full border px-3 py-1 text-xs hover:border-primary hover:text-primary"
              >
                {idea}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromptOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => run(instruction.trim())} disabled={!instruction.trim()}>
              <Sparkles className="h-4 w-4 mr-2" /> Re-plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Day {day}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the day and all its activities. Later days shift up by one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => actions.deleteDay(day)}
            >
              Delete day
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
