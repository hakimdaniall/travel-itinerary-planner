import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  ArrowLeft,
  ArrowRight,
  Plane,
  Plus,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import type { Pace, TravelerGroup, TripData } from "@/types/trip";

const TRAVELERS: { value: TravelerGroup; emoji: string; label: string }[] = [
  { value: "solo", emoji: "🎒", label: "Solo" },
  { value: "couple", emoji: "💑", label: "Couple" },
  { value: "family", emoji: "🧸", label: "Family" },
  { value: "friends", emoji: "🎉", label: "Friends" },
];

const PACES: { value: Pace; emoji: string; label: string; hint: string }[] = [
  { value: "relaxed", emoji: "🌿", label: "Relaxed", hint: "3–4 things a day" },
  { value: "balanced", emoji: "⚖️", label: "Balanced", hint: "5–6 things a day" },
  { value: "packed", emoji: "⚡", label: "Packed", hint: "See it all" },
];

export const STYLES = [
  { value: "culture", emoji: "🏛️", label: "Culture" },
  { value: "food", emoji: "🍜", label: "Foodie" },
  { value: "nature", emoji: "🌲", label: "Nature" },
  { value: "adventure", emoji: "🧗", label: "Adventure" },
  { value: "relaxation", emoji: "🏖️", label: "Relaxation" },
  { value: "nightlife", emoji: "🍸", label: "Nightlife" },
  { value: "shopping", emoji: "🛍️", label: "Shopping" },
  { value: "romance", emoji: "💕", label: "Romance" },
  { value: "history", emoji: "📜", label: "History" },
  { value: "art", emoji: "🎨", label: "Art" },
  { value: "photography", emoji: "📸", label: "Photo spots" },
  { value: "hidden gems", emoji: "💎", label: "Hidden gems" },
];

const CURRENCIES = ["MYR", "USD", "EUR", "GBP", "JPY", "SGD", "IDR", "THB", "AUD"];

const STEPS = [
  { title: "Where are you going?", subtitle: "Add one or more stops, in order." },
  { title: "When are you travelling?", subtitle: "Pick your first and last day." },
  { title: "Who's coming along?", subtitle: "We'll tune the plan to your group and pace." },
  { title: "What's your vibe?", subtitle: "Pick as many as you like." },
  { title: "Set your budget", subtitle: "A total for the whole trip." },
];

const Chip = ({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      "rounded-xl border-2 px-4 py-3 text-left transition-colors",
      selected
        ? "border-primary bg-primary/10 text-foreground"
        : "border-border bg-card hover:border-primary/40",
      className,
    )}
  >
    {children}
  </motion.button>
);

interface TripWizardProps {
  onGenerate: (data: TripData) => void;
  onCustom: (data: TripData) => void;
}

const TripWizard = ({ onGenerate, onCustom }: TripWizardProps) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [from, setFrom] = useState("");
  const [destinations, setDestinations] = useState<string[]>([""]);
  const [dates, setDates] = useState<DateRange | undefined>();
  const [travelers, setTravelers] = useState<TravelerGroup>("couple");
  const [pace, setPace] = useState<Pace>("balanced");
  const [styles, setStyles] = useState<string[]>([]);
  const [budget, setBudget] = useState("3000");
  const [currency, setCurrency] = useState("MYR");
  const [includeFlights, setIncludeFlights] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days =
    dates?.from && dates?.to
      ? differenceInCalendarDays(dates.to, dates.from) + 1
      : 0;

  const validate = (s: number): string | null => {
    if (s === 0) {
      if (!from.trim()) return "Where are you starting from?";
      if (!destinations.some((d) => d.trim())) return "Add at least one destination";
    }
    if (s === 1 && (!dates?.from || !dates?.to)) return "Pick a start and end date";
    if (s === 4 && !(Number(budget) > 0)) return "Budget must be greater than 0";
    return null;
  };

  const go = (next: number) => {
    if (next > step) {
      const problem = validate(step);
      if (problem) {
        setError(problem);
        return;
      }
    }
    setError(null);
    setDirection(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const build = (): TripData | null => {
    for (let s = 0; s < STEPS.length; s++) {
      const problem = validate(s);
      if (problem) {
        setError(problem);
        setStep(s);
        return null;
      }
    }
    return {
      fromDestination: from.trim(),
      destinations: destinations.map((d) => d.trim()).filter(Boolean),
      startDate: startOfDay(dates!.from!),
      endDate: startOfDay(dates!.to!),
      days,
      includeFlights,
      budget: Number(budget),
      currency,
      travelers,
      pace,
      styles,
    };
  };

  const toggleStyle = (value: string) =>
    setStyles((s) => (s.includes(value) ? s.filter((v) => v !== value) : [...s, value]));

  const isLast = step === STEPS.length - 1;
  const perDay = days > 0 ? Math.round(Number(budget) / days) : 0;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 flex gap-1.5">
        {STEPS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => i < step && go(i)}
            aria-label={`Step ${i + 1}`}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      <div className="relative min-h-[420px]">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <p className="text-sm font-medium text-primary mb-1">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-2">
              {STEPS[step].title}
            </h2>
            <p className="text-muted-foreground mb-8">{STEPS[step].subtitle}</p>

            {step === 0 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="from">Starting from</Label>
                  <PlaceAutocomplete
                    id="from"
                    value={from}
                    onChange={setFrom}
                    placeholder="e.g. Kuala Lumpur"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destinations</Label>
                  {destinations.map((dest, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="grid place-items-center h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <PlaceAutocomplete
                          value={dest}
                          onChange={(v) =>
                            setDestinations((ds) => ds.map((d, j) => (j === i ? v : d)))
                          }
                          placeholder={i === 0 ? "e.g. Tokyo" : "Next stop"}
                        />
                      </div>
                      {destinations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDestinations((ds) => ds.filter((_, j) => j !== i))}
                          aria-label="Remove destination"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => setDestinations((ds) => [...ds, ""])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add another stop
                  </Button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-2 inline-block">
                  <Calendar
                    mode="range"
                    selected={dates}
                    onSelect={setDates}
                    disabled={(date) => date < startOfDay(new Date())}
                    numberOfMonths={isMobile ? 1 : 2}
                    defaultMonth={dates?.from}
                  />
                </div>
                {days > 0 && (
                  <p className="text-lg">
                    <span className="font-semibold">{days} day{days > 1 ? "s" : ""}</span>{" "}
                    <span className="text-muted-foreground">
                      · {format(dates!.from!, "EEE d MMM")} → {format(dates!.to!, "EEE d MMM yyyy")}
                    </span>
                  </p>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TRAVELERS.map((t) => (
                    <Chip
                      key={t.value}
                      selected={travelers === t.value}
                      onClick={() => setTravelers(t.value)}
                      className="text-center"
                    >
                      <div className="text-3xl mb-1">{t.emoji}</div>
                      <div className="font-medium">{t.label}</div>
                    </Chip>
                  ))}
                </div>
                <div className="space-y-3">
                  <Label>Pace</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {PACES.map((p) => (
                      <Chip key={p.value} selected={pace === p.value} onClick={() => setPace(p.value)}>
                        <div className="text-xl">{p.emoji}</div>
                        <div className="font-medium">{p.label}</div>
                        <div className="text-xs text-muted-foreground">{p.hint}</div>
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <motion.button
                    key={s.value}
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => toggleStyle(s.value)}
                    aria-pressed={styles.includes(s.value)}
                    className={cn(
                      "rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors",
                      styles.includes(s.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <span className="mr-1.5">{s.emoji}</span>
                    {s.label}
                  </motion.button>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Total budget</Label>
                    <Input
                      id="budget"
                      type="number"
                      min={1}
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="text-lg h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-12 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {perDay > 0 && (
                  <p className="text-sm text-muted-foreground">
                    That's about <span className="font-semibold text-foreground">{currency} {perDay.toLocaleString()}</span> per day.
                  </p>
                )}
                <label className="flex items-center justify-between rounded-xl border bg-card p-4 cursor-pointer">
                  <span className="flex items-center gap-3">
                    <Plane className="h-5 w-5 text-primary" />
                    <span>
                      <span className="font-medium block">Include flights</span>
                      <span className="text-sm text-muted-foreground">
                        Adds flights from {from || "your city"} and back
                      </span>
                    </span>
                  </span>
                  <Switch checked={includeFlights} onCheckedChange={setIncludeFlights} />
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && <p className="text-sm text-destructive mt-4">{error}</p>}

      <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => go(step - 1)}
          disabled={step === 0}
          className={step === 0 ? "invisible" : ""}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {isLast ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                const data = build();
                if (data) onCustom(data);
              }}
            >
              <Wrench className="h-4 w-4 mr-2" />
              I'll build it myself
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={() => {
                const data = build();
                if (data) onGenerate(data);
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate my trip
            </Button>
          </div>
        ) : (
          <Button type="button" size="lg" onClick={() => go(step + 1)}>
            {step === 3 && styles.length === 0 ? "Skip" : "Next"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default TripWizard;
