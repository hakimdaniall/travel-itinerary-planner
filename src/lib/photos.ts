const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as
  | string
  | undefined;

const WIKI_API = "https://en.wikipedia.org/w/api.php";

const CACHE_PREFIX = "tripplanner-photo:";
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7;

/** Memoizes a lookup in localStorage for a week, including "not found" results. */
const cached = async <T>(key: string, load: () => Promise<T>): Promise<T> => {
  try {
    const hit = localStorage.getItem(CACHE_PREFIX + key);
    if (hit) {
      const { at, value } = JSON.parse(hit);
      if (Date.now() - at < CACHE_TTL) return value as T;
    }
  } catch {
    // Ignore unreadable cache entries.
  }
  const value = await load();
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), value }));
  } catch {
    // Storage full; the result just isn't cached.
  }
  return value;
};

export interface Photo {
  url: string;
  credit?: string;
  creditUrl?: string;
}

export interface PlaceInfo {
  title: string;
  thumbnail?: string;
  extract?: string;
  url: string;
}

interface WikiPage {
  title: string;
  index?: number;
  thumbnail?: { source: string };
  pageimage?: string;
  extract?: string;
  imageinfo?: { thumburl?: string; width: number; height: number }[];
}

const wikiQuery = async (params: Record<string, string>) => {
  const search = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    redirects: "1",
    ...params,
  });
  const res = await fetch(`${WIKI_API}?${search}`);
  // Throw (rather than return nothing) so rate-limit errors aren't cached as "no photo".
  if (!res.ok) throw new Error(`Wikipedia request failed (${res.status})`);
  const data = await res.json();
  const pages = Object.values(data.query?.pages ?? {}) as WikiPage[];
  return pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
};

/** A large landscape photo of a city, from Unsplash when a key is set, else Wikipedia. */
export const getDestinationPhoto = (destination: string) =>
  cached(`dest:${destination.toLowerCase()}`, () => loadDestinationPhoto(destination));

const loadDestinationPhoto = async (
  destination: string,
): Promise<Photo | null> => {
  if (UNSPLASH_KEY) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(`${destination} travel`)}&orientation=landscape&per_page=1&client_id=${UNSPLASH_KEY}`,
      );
      if (res.ok) {
        const data = await res.json();
        const photo = data.results?.[0];
        if (photo) {
          return {
            url: photo.urls.regular,
            credit: photo.user.name,
            creditUrl: `${photo.user.links.html}?utm_source=travel_itinerary_planner&utm_medium=referral`,
          };
        }
      }
    } catch {
      // Fall through to Wikipedia.
    }
  }

  const [page] = await wikiQuery({
    titles: destination,
    prop: "pageimages",
    piprop: "thumbnail|name",
    pithumbsize: "1600",
  });
  if (page?.thumbnail && page.pageimage && isPhoto(page.pageimage)) {
    return { url: page.thumbnail.source, credit: "Wikipedia" };
  }

  // Lead image is a map or flag (common for islands and states); pick a
  // landscape photo from the article instead.
  const files = await wikiQuery({
    titles: destination,
    generator: "images",
    gimlimit: "50",
    prop: "imageinfo",
    iiprop: "url|size",
    iiurlwidth: "1600",
  });
  const photo = files.find((f) => {
    const info = f.imageinfo?.[0];
    return isPhoto(f.title) && info && info.width > info.height * 1.2 && info.width >= 1000;
  });
  const url = photo?.imageinfo?.[0].thumburl;
  return url ? { url, credit: "Wikipedia" } : null;
};

const NOT_A_PHOTO = /map|flag|locat|logo|coat_of_arms|coat of arms|seal|icon|emblem|symbol|diagram|chart/i;

const isPhoto = (fileName: string) =>
  /\.jpe?g$/i.test(fileName) && !NOT_A_PHOTO.test(fileName);

const GENERIC_WORDS = new Set([
  "the", "a", "an", "at", "in", "of", "and", "to", "for", "on", "with",
  "hotel", "restaurant", "cafe", "breakfast", "lunch", "dinner", "local",
  "street", "road", "station", "airport", "international", "visit", "tour",
  "check", "checkin", "checkout",
]);

const tokens = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !GENERIC_WORDS.has(t));

/**
 * Looks up a landmark on Wikipedia. Only returns a match when the article
 * title shares a distinctive word with the query, so generic places like
 * "Hotel lobby" don't get an unrelated photo.
 */
export const getPlaceInfo = (place: string, city?: string) =>
  cached(`place:${place.toLowerCase()}|${city?.toLowerCase() ?? ""}`, () =>
    loadPlaceInfo(place, city),
  );

const loadPlaceInfo = async (
  place: string,
  city?: string,
): Promise<PlaceInfo | null> => {
  const placeTokens = tokens(place);
  if (placeTokens.length === 0) return null;

  const pages = await wikiQuery({
    generator: "search",
    gsrsearch: city ? `${place} ${city}` : place,
    gsrlimit: "3",
    prop: "pageimages|extracts",
    piprop: "thumbnail",
    pithumbsize: "400",
    exintro: "1",
    explaintext: "1",
    exsentences: "2",
  });

  const match = pages.find((p) => {
    const titleTokens = tokens(p.title);
    return placeTokens.some((t) => titleTokens.includes(t));
  });
  if (!match) return null;

  return {
    title: match.title,
    thumbnail: match.thumbnail?.source,
    extract: match.extract,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(match.title.replace(/ /g, "_"))}`,
  };
};

/** Deterministic gradient for a destination, used while photos load or when none exist. */
export const destinationGradient = (name: string) => {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 50) % 360} 75% 35%))`;
};
