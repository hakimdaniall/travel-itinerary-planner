import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ArrowRight, CalendarDays, MapPin, MoreVertical, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import AppShell from "@/components/AppShell";
import { TripCover, countdownLabel } from "@/components/trip/TripHero";
import { pickTripFile, useTripStore } from "@/store/tripStore";
import { TEMPLATES, instantiateTemplate } from "@/data/templates";
import type { Trip } from "@/types/trip";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06 } }),
};

const TripCard = ({ trip, index, onDelete }: { trip: Trip; index: number; onDelete: () => void }) => {
  const { tripData } = trip;
  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="show" whileHover={{ y: -4 }}>
      <Link
        to={`/trip/${trip.id}`}
        className="group block overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
      >
        <TripCover destination={tripData.destinations[0] ?? ""} className="h-40 text-white">
          <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold backdrop-blur">
            {countdownLabel(trip)}
          </span>
          <h3 className="absolute bottom-3 left-4 right-4 font-display text-2xl font-semibold leading-tight">
            {tripData.destinations.join(" → ")}
          </h3>
        </TripCover>
        <div className="flex items-center justify-between gap-2 p-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {format(tripData.startDate, "d MMM")} – {format(tripData.endDate, "d MMM yyyy")}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {trip.itinerary.length}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Trip options"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete trip
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Link>
    </motion.div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const tripsById = useTripStore((s) => s.trips);
  const createTrip = useTripStore((s) => s.createTrip);
  const deleteTrip = useTripStore((s) => s.deleteTrip);
  const [pendingDelete, setPendingDelete] = useState<Trip | null>(null);

  const trips = useMemo(() => {
    const now = Date.now();
    const all = Object.values(tripsById);
    // Upcoming and ongoing trips first (soonest first), then past trips (latest first).
    const upcoming = all
      .filter((t) => t.tripData.endDate.getTime() >= now - 86400000)
      .sort((a, b) => a.tripData.startDate.getTime() - b.tripData.startDate.getTime());
    const past = all
      .filter((t) => t.tripData.endDate.getTime() < now - 86400000)
      .sort((a, b) => b.tripData.startDate.getTime() - a.tripData.startDate.getTime());
    return [...upcoming, ...past];
  }, [tripsById]);

  const loadFile = async () => {
    try {
      const file = await pickTripFile();
      const id = createTrip(file.tripData, file.itinerary, {
        createdBy: file.createdBy,
        ...(file.packingList ? { packingList: file.packingList } : {}),
        ...(file.todoList ? { todoList: file.todoList } : {}),
      });
      toast.success("Itinerary loaded");
      navigate(`/trip/${id}`);
    } catch {
      toast.error("That file couldn't be loaded", {
        description: "Make sure it's an itinerary .json saved from this app.",
      });
    }
  };

  const startFromTemplate = (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId)!;
    const { tripData, itinerary } = instantiateTemplate(template);
    const id = createTrip(tripData, itinerary);
    toast.success(`${template.title} added to your trips`, {
      description: "Dates start in a month; change anything you like.",
    });
    navigate(`/trip/${id}`);
  };

  return (
    <AppShell>
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-amber-100/40 dark:to-amber-900/10">
        <div className="container mx-auto grid items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" /> AI trip planning, with maps and weather
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Where to <span className="italic text-primary">next?</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              Tell us where and how you like to travel. Get a day-by-day plan on a map, then tweak
              it with drag-and-drop or just by asking.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="h-12 px-6 text-base">
                <Link to="/new">
                  Plan a trip <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12" onClick={loadFile}>
                <Upload className="h-4 w-4 mr-2" /> Open saved file
              </Button>
            </div>
          </motion.div>

          <div className="relative hidden h-[360px] lg:block">
            {TEMPLATES.slice(0, 3).map((t, i) => (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => startFromTemplate(t.id)}
                initial={{ opacity: 0, y: 40, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: [-6, 3, -2][i] }}
                whileHover={{ scale: 1.04, rotate: 0, zIndex: 10 }}
                transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 120 }}
                className="absolute w-60 overflow-hidden rounded-2xl border-4 border-white bg-card text-left shadow-2xl dark:border-slate-800"
                style={{ left: `${i * 26}%`, top: `${[8, 30, 2][i]}%` }}
              >
                <TripCover destination={t.destination} className="h-44 text-white">
                  <span className="absolute bottom-2 left-3 font-display text-xl font-semibold">{t.destination}</span>
                </TripCover>
                <p className="px-3 py-2 text-sm font-medium">{t.title}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto space-y-14 px-4 py-12">
        {trips.length > 0 && (
          <section>
            <h2 className="mb-5 font-display text-3xl font-semibold">My trips</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip, i) => (
                <TripCard key={trip.id} trip={trip} index={i} onDelete={() => setPendingDelete(trip)} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-5">
            <h2 className="font-display text-3xl font-semibold">Start from a template</h2>
            <p className="text-muted-foreground">Ready-made plans you can make your own.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((t, i) => (
              <motion.button
                key={t.id}
                type="button"
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                onClick={() => startFromTemplate(t.id)}
                className="overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-shadow hover:shadow-lg"
              >
                <TripCover destination={t.destination} className="h-36 text-white">
                  <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                    {t.days} days
                  </span>
                </TripCover>
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold">{t.title}</h3>
                  <p className="text-sm text-muted-foreground">{t.subtitle}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    ~MYR {t.budget.toLocaleString()} · {t.items.length} activities
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete your {pendingDelete?.tripData.destinations[0]} trip?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from this browser. Save it as a file first if you might want it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) deleteTrip(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default Index;
