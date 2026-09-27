import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  searchCities,
  searchPlaces,
  type LatLng,
  type PlaceSuggestion,
} from "@/lib/geo";

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (place: PlaceSuggestion) => void;
  /** "city" searches towns and regions; "place" searches landmarks, restaurants and hotels. */
  mode?: "city" | "place";
  near?: LatLng;
  placeholder?: string;
  id?: string;
  className?: string;
  autoFocus?: boolean;
}

const PlaceAutocomplete = ({
  value,
  onChange,
  onSelect,
  mode = "city",
  near,
  placeholder,
  id,
  className,
  autoFocus,
}: PlaceAutocompleteProps) => {
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  // Skip the search right after a suggestion is picked.
  const justSelected = useRef(false);

  useEffect(() => {
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const found =
          mode === "city"
            ? await searchCities(value, controller.signal)
            : await searchPlaces(value, near, controller.signal);
        setResults(found);
        setHighlight(0);
      } catch {
        // Aborted or offline; keep the free text.
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, mode, near?.lat, near?.lng]);

  const select = (place: PlaceSuggestion) => {
    justSelected.current = true;
    onChange(place.name);
    onSelect?.(place);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder}
        className={cn("pr-8", className)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || results.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => (h + 1) % results.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => (h - 1 + results.length) % results.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            select(results[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {loading && (
        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
          {results.map((place, i) => (
            <li key={`${place.id}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(place)}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2 text-left text-sm",
                  i === highlight && "bg-accent",
                )}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-medium">{place.name}</span>
                  {place.detail && (
                    <span className="block text-xs text-muted-foreground">
                      {place.detail}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlaceAutocomplete;
