/**
 * City → Unsplash photo URL map.
 *
 * Used as a fallback cover image when a trip has no `cover_image_url`.
 * Keys are lowercase city names (no diacritics) for fuzzy matching.
 * All URLs are parameter-based CDN links — no API key needed.
 */
const CITY_IMAGES: Record<string, string> = {
  paris:        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  rome:         "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
  barcelona:    "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80",
  amsterdam:    "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800&q=80",
  prague:       "https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&q=80",
  lisbon:       "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80",
  istanbul:     "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80",
  tokyo:        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
  kyoto:        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
  bangkok:      "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80",
  "new york":   "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
  reykjavik:    "https://images.unsplash.com/photo-1474690870753-1b92efa1f2d8?w=800&q=80",
  manaus:       "https://images.unsplash.com/photo-1544989164-31e89a5a37dc?w=800&q=80",
  "cape town":  "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80",
  sydney:       "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80",
  rio:          "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80",
  dubai:        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
  bali:         "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
  london:       "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
  singapore:    "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
  maldives:     "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
  santorini:    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  athens:       "https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80",
  milan:        "https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?w=800&q=80",
  venice:       "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80",
  vienna:       "https://images.unsplash.com/photo-1516550135131-field?w=800&q=80",
  berlin:       "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80",
  zurich:       "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=800&q=80",
  seoul:        "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&q=80",
  hongkong:     "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80",
  "hong kong":  "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80",
  shanghai:     "https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=800&q=80",
  beijing:      "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80",
  mumbai:       "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
  cairo:        "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80",
  marrakech:    "https://images.unsplash.com/photo-1539020140153-e479b8f22986?w=800&q=80",
  nairobi:      "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800&q=80",
  mexico:       "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&q=80",
  havana:       "https://images.unsplash.com/photo-1500759285222-a95626359a56?w=800&q=80",
};

/** Generic travel fallbacks cycled by hash so different trips get different images */
const FALLBACKS = [
  "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80", // world map / travel
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80", // mountain lake
  "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800&q=80", // tropical beach
  "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=80", // road trip
  "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800&q=80", // city lights
];

/**
 * Returns an image URL for a trip.
 * Priority: explicit cover_image_url → city name match in trip name/description → generic fallback.
 */
export function getTripCoverImage(
  trip: { cover_image_url?: string | null; name: string; description?: string | null; id: string }
): string {
  if (trip.cover_image_url) return trip.cover_image_url;

  const text = `${trip.name} ${trip.description ?? ""}`.toLowerCase();

  // Sort by key length descending so "hong kong" matches before "kong"
  const keys = Object.keys(CITY_IMAGES).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (text.includes(key)) return CITY_IMAGES[key];
  }

  // Generic fallback — deterministic per trip id so the same trip always
  // gets the same image, but different trips get different ones.
  const hash = trip.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACKS[hash % FALLBACKS.length];
}
