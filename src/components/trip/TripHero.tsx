import { useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CalendarPlus,
  Download,
  FileJson,
  FileText,
  MoreHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDestinationPhoto } from "@/hooks/useTripMedia";
import { destinationGradient } from "@/lib/photos";
import { defaultFileBase, downloadTripIcs, downloadTripJson, downloadTripPdf } from "@/lib/exporters";
import { analyticsService } from "@/api/analyticsService";
import { useTripStore } from "@/store/tripStore";
import { STYLES } from "@/components/wizard/TripWizard";
import type { Trip } from "@/types/trip";
import ShareDialog from "./ShareDialog";
import { useTripContext } from "./TripContext";

export const countdownLabel = (trip: Trip) => {
  const today = new Date();
  const toStart = differenceInCalendarDays(trip.tripData.startDate, today);
  const toEnd = differenceInCalendarDays(trip.tripData.endDate, today);
  if (toStart > 1) return `${toStart} days to go`;
  if (toStart === 1) return "Tomorrow!";
  if (toStart === 0) return "Starts today!";
  if (toEnd >= 0) return `Day ${-toStart + 1} of ${trip.tripData.days}`;
  return "Completed";
};

export const TripCover = ({
  destination,
  className,
  children,
}: {
  destination: string;
  className?: string;
  children?: React.ReactNode;
}) => {
  const { data: photo } = useDestinationPhoto(destination);
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`} style={{ background: destinationGradient(destination) }}>
      {photo && (
        <motion.img
          src={photo.url}
          alt=""
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
      {children}
      {photo?.credit && (
        <span className="absolute bottom-1.5 right-2 text-[10px] text-white/60">
          Photo:{" "}
          {photo.creditUrl ? (
            <a href={photo.creditUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {photo.credit}
            </a>
          ) : (
            photo.credit
          )}
        </span>
      )}
    </div>
  );
};

const TripHero = () => {
  const { trip, actions } = useTripContext();
  const { tripData } = trip;
  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState(trip.createdBy ?? "");
  const [confirmClear, setConfirmClear] = useState(false);
  const styleLabels = (tripData.styles ?? [])
    .map((s) => STYLES.find((x) => x.value === s))
    .filter(Boolean);

  const exportPdf = async () => {
    const fileName = await downloadTripPdf(trip, defaultFileBase(trip));
    toast.success(`Saved ${fileName}`);
    analyticsService
      .trackExported(tripData.destinations[0] ?? "Unknown", tripData.days, tripData.budget, trip.createdBy)
      .catch(() => {});
  };

  const exportIcs = async () => {
    try {
      const fileName = await downloadTripIcs(trip);
      toast.success(`Saved ${fileName}`, {
        description: "Open it to add every activity to your calendar.",
      });
    } catch {
      toast.error("Couldn't create the calendar file");
    }
  };

  const saveJson = () => {
    const createdBy = name.trim();
    if (!createdBy) return;
    useTripStore.getState().updateTrip(trip.id, { createdBy });
    const fileName = downloadTripJson(trip, createdBy);
    setNameOpen(false);
    toast.success(`Saved ${fileName}`);
    analyticsService
      .trackSaved(tripData.destinations[0] ?? "Unknown", tripData.days, tripData.budget, createdBy)
      .catch(() => {});
  };

  return (
    <TripCover destination={tripData.destinations[0] ?? ""} className="rounded-3xl text-white">
      <div className="relative flex min-h-[260px] flex-col justify-end gap-4 p-6 sm:min-h-[320px] sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            {countdownLabel(trip)}
          </span>
          {tripData.travelers && (
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium capitalize backdrop-blur">
              <Users className="h-3 w-3" /> {tripData.travelers}
            </span>
          )}
          {styleLabels.map((s) => (
            <span key={s!.value} className="rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
              {s!.emoji} {s!.label}
            </span>
          ))}
        </div>
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl drop-shadow">
            {tripData.destinations.join(" → ")}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-white/85">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {format(tripData.startDate, "d MMM")} – {format(tripData.endDate, "d MMM yyyy")}
            </span>
            <span>· {tripData.days} days</span>
            {tripData.fromDestination && <span>· from {tripData.fromDestination}</span>}
            {trip.createdBy && <span>· by {trip.createdBy}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions && <ShareDialog />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={exportPdf}>
                <FileText className="h-4 w-4 mr-2" /> PDF document
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={exportIcs}>
                <CalendarPlus className="h-4 w-4 mr-2" /> Add to calendar (.ics)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setNameOpen(true)}>
                <FileJson className="h-4 w-4 mr-2" /> Project file (.json)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {actions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-9 w-9" aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={actions.addDay}>Add a day</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={trip.itinerary.length === 0}
                  onSelect={() => setConfirmClear(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Clear all activities
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save project file</DialogTitle>
            <DialogDescription>
              Downloads a .json file you can load later or send to a friend.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="creator">Your name</Label>
            <Input
              id="creator"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveJson()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button onClick={saveJson} disabled={!name.trim()}>
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear every activity?</AlertDialogTitle>
            <AlertDialogDescription>
              Your days stay, but all activities are removed. You can undo right after.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => actions?.clearAll()}
            >
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TripCover>
  );
};

export default TripHero;
