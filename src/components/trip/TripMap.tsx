import { Fragment, useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ItineraryItem } from "@/types/trip";
import { hasCoords, type LatLng } from "@/lib/geo";
import { byTime } from "@/lib/itinerary";

export const DAY_COLORS = [
  "#0d9488", "#e11d48", "#7c3aed", "#d97706",
  "#2563eb", "#db2777", "#65a30d", "#0891b2",
];

export const dayColor = (day: number) => DAY_COLORS[(day - 1) % DAY_COLORS.length];

// OpenStreetMap's tiles are fine for light use. For heavy production traffic,
// set VITE_MAP_TILE_URL to a keyed provider (e.g. MapTiler, Stadia, Thunderforest).
const TILE_URL =
  (import.meta.env.VITE_MAP_TILE_URL as string | undefined) ??
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  (import.meta.env.VITE_MAP_TILE_ATTRIBUTION as string | undefined) ??
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const markerIcon = (label: string, color: string, active: boolean) =>
  L.divIcon({
    className: "",
    html: `<div class="trip-marker${active ? " is-active" : ""}" style="background:${color};width:26px;height:26px">${label}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const FitBounds = ({ points, fallback }: { points: LatLng[]; fallback?: LatLng }) => {
  const map = useMap();
  const key = points.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join("|");

  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true });
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), {
        padding: [40, 40],
        maxZoom: 15,
        animate: true,
      });
    } else if (fallback) {
      map.setView(fallback, 11);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fallback?.lat, fallback?.lng]);

  return null;
};

/** Keeps Leaflet in sync when its container is resized by layout changes. */
const ResizeWatcher = () => {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
};

interface TripMapProps {
  items: ItineraryItem[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  fallbackCenter?: LatLng;
  className?: string;
}

const TripMap = ({ items, activeId, onSelect, fallbackCenter, className }: TripMapProps) => {
  const byDay = useMemo(() => {
    const groups = new Map<number, (ItineraryItem & LatLng)[]>();
    for (const item of [...items].sort((a, b) => a.day - b.day || byTime(a, b))) {
      if (!hasCoords(item)) continue;
      if (!groups.has(item.day)) groups.set(item.day, []);
      groups.get(item.day)!.push(item);
    }
    return groups;
  }, [items]);

  // Flights span continents; leave them out of the bounds so the map stays on the city.
  const points = useMemo(
    () => [...byDay.values()].flat().filter((i) => i.type !== "flight"),
    [byDay],
  );

  return (
    <MapContainer
      center={fallbackCenter ?? { lat: 20, lng: 0 }}
      zoom={fallbackCenter ? 11 : 2}
      scrollWheelZoom
      className={className}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} className="trip-tiles" />
      <FitBounds points={points} fallback={fallbackCenter} />
      <ResizeWatcher />
      {[...byDay.entries()].map(([day, dayItems]) => {
        const color = dayColor(day);
        const route = dayItems.filter((i) => i.type !== "flight");
        return (
          <Fragment key={day}>
            {route.length > 1 && (
              <Polyline
                positions={route.map((i) => [i.lat, i.lng])}
                pathOptions={{ color, weight: 3, opacity: 0.7, dashArray: "6 8" }}
              />
            )}
            {route.map((item, i) => (
              <Marker
                key={item.id}
                position={[item.lat, item.lng]}
                icon={markerIcon(String(i + 1), color, item.id === activeId)}
                zIndexOffset={item.id === activeId ? 1000 : 0}
                eventHandlers={{ click: () => onSelect?.(item.id) }}
              >
                <Tooltip direction="top" offset={[0, -12]}>
                  <div className="text-xs">
                    <div className="font-semibold">{item.activity}</div>
                    <div className="opacity-70">
                      Day {day} · {item.time}
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </Fragment>
        );
      })}
    </MapContainer>
  );
};

export default TripMap;
