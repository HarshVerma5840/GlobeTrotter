"""
Seed the City and Activity catalogs (Backend B5).

Run it with:

    docker compose exec api python -m app.seed

Two rules this script exists to guarantee (CONTRACTS §2/§8):

  * EVERY city has a real latitude/longitude. The route map (§7.2), the
    Directions call and the Haversine fallback are all silently useless
    without them, so a city without coordinates is never written.
  * Activities span ALL SIX categories in every city. The budget
    breakdown (§5) groups by category, and the Smart Trip Assistant
    (§7.1) filters candidates by interest category — both look broken on
    a catalog that only has `sightseeing` rows.

Idempotent: matches cities on (name, country) and activities on
(city, name), so re-running adds what's missing and never duplicates.
Coordinates are real city-centre values, and the set deliberately spans
several continents so B11's feasibility check has genuinely long-haul
pairs (Reykjavik <-> Bangkok) to flag, not just neighbouring EU cities.
"""
from __future__ import annotations

import asyncio
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.activity import Activity, ActivityCategory
from app.models.city import City

# (name, category, cost, duration_hours)
CATALOG: list[dict] = [
    {
        "name": "Paris", "country": "France",
        "latitude": 48.8566, "longitude": 2.3522,
        "cost_index": 85.0, "popularity": 98,
        "image_url": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
        "activities": [
            ("Louvre Museum", "sightseeing", "22.00", 3.5),
            ("Le Marais food walk", "food", "65.00", 3.0),
            ("Seine kayak session", "adventure", "45.00", 2.0),
            ("Metro 3-day pass", "transport", "22.50", 0.5),
            ("Boutique hotel, Latin Quarter", "stay", "180.00", 24.0),
            ("Opera Garnier evening show", "other", "95.00", 2.5),
        ],
    },
    {
        "name": "Rome", "country": "Italy",
        "latitude": 41.9028, "longitude": 12.4964,
        "cost_index": 72.0, "popularity": 95,
        "image_url": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
        "activities": [
            ("Colosseum and Forum", "sightseeing", "18.00", 3.0),
            ("Trastevere trattoria crawl", "food", "55.00", 3.0),
            ("Appian Way cycling", "adventure", "38.00", 4.0),
            ("Airport express transfer", "transport", "14.00", 1.0),
            ("Guesthouse near Pantheon", "stay", "120.00", 24.0),
            ("Vatican Museums early access", "other", "45.00", 3.0),
        ],
    },
    {
        "name": "Barcelona", "country": "Spain",
        "latitude": 41.3874, "longitude": 2.1686,
        "cost_index": 68.0, "popularity": 93,
        "image_url": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80",
        "activities": [
            ("Sagrada Familia", "sightseeing", "26.00", 2.0),
            ("Tapas and vermouth tour", "food", "48.00", 3.0),
            ("Montserrat via ferrata", "adventure", "75.00", 6.0),
            ("Airport Aerobus", "transport", "6.75", 0.5),
            ("Eixample apartment", "stay", "110.00", 24.0),
            ("Flamenco at Palau Dalmases", "other", "30.00", 1.5),
        ],
    },
    {
        "name": "Amsterdam", "country": "Netherlands",
        "latitude": 52.3676, "longitude": 4.9041,
        "cost_index": 88.0, "popularity": 89,
        "image_url": "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800&q=80",
        "activities": [
            ("Rijksmuseum", "sightseeing", "22.50", 2.5),
            ("Cheese and jenever tasting", "food", "42.00", 2.0),
            ("Canal kayak tour", "adventure", "35.00", 2.5),
            ("OV-chipkaart transit pass", "transport", "9.00", 0.5),
            ("Canal-house B&B", "stay", "165.00", 24.0),
            ("Concertgebouw concert", "other", "55.00", 2.0),
        ],
    },
    {
        "name": "Prague", "country": "Czechia",
        "latitude": 50.0755, "longitude": 14.4378,
        "cost_index": 48.0, "popularity": 86,
        "image_url": "https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&q=80",
        "activities": [
            ("Prague Castle complex", "sightseeing", "17.00", 3.0),
            ("Czech beer hall dinner", "food", "28.00", 2.5),
            ("Vltava paddleboarding", "adventure", "32.00", 2.0),
            ("Tram and metro day pass", "transport", "5.50", 0.5),
            ("Old Town pension", "stay", "78.00", 24.0),
            ("Black light theatre", "other", "24.00", 1.5),
        ],
    },
    {
        "name": "Lisbon", "country": "Portugal",
        "latitude": 38.7223, "longitude": -9.1393,
        "cost_index": 55.0, "popularity": 88,
        "image_url": "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80",
        "activities": [
            ("Belem Tower and Jeronimos", "sightseeing", "18.00", 3.0),
            ("Pastel de nata and seafood tour", "food", "45.00", 3.0),
            ("Atlantic surf lesson, Carcavelos", "adventure", "50.00", 3.0),
            ("Tram 28 and metro pass", "transport", "6.80", 0.5),
            ("Alfama guesthouse", "stay", "95.00", 24.0),
            ("Fado night in Bairro Alto", "other", "35.00", 2.0),
        ],
    },
    {
        "name": "Istanbul", "country": "Turkiye",
        "latitude": 41.0082, "longitude": 28.9784,
        "cost_index": 42.0, "popularity": 90,
        "image_url": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80",
        "activities": [
            ("Hagia Sophia and Blue Mosque", "sightseeing", "25.00", 3.5),
            ("Bosphorus meyhane dinner", "food", "38.00", 3.0),
            ("Princes' Islands cycling", "adventure", "30.00", 5.0),
            ("Istanbulkart transit pass", "transport", "8.00", 0.5),
            ("Sultanahmet boutique hotel", "stay", "85.00", 24.0),
            ("Traditional hammam", "other", "40.00", 1.5),
        ],
    },
    {
        "name": "Tokyo", "country": "Japan",
        "latitude": 35.6762, "longitude": 139.6503,
        "cost_index": 92.0, "popularity": 97,
        "image_url": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
        "activities": [
            ("Senso-ji and Asakusa", "sightseeing", "0.00", 2.5),
            ("Tsukiji outer market breakfast", "food", "35.00", 2.0),
            ("Mount Takao day hike", "adventure", "25.00", 6.0),
            ("Suica card and JR day pass", "transport", "16.00", 0.5),
            ("Shinjuku business hotel", "stay", "140.00", 24.0),
            ("teamLab digital art museum", "other", "32.00", 3.0),
        ],
    },
    {
        "name": "Kyoto", "country": "Japan",
        "latitude": 35.0116, "longitude": 135.7681,
        "cost_index": 80.0, "popularity": 91,
        "image_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
        "activities": [
            ("Fushimi Inari shrine", "sightseeing", "0.00", 2.5),
            ("Nishiki Market tasting walk", "food", "40.00", 2.0),
            ("Arashiyama bamboo cycle route", "adventure", "22.00", 3.5),
            ("Kyoto city bus pass", "transport", "5.00", 0.5),
            ("Machiya townhouse ryokan", "stay", "195.00", 24.0),
            ("Tea ceremony in Gion", "other", "48.00", 1.5),
        ],
    },
    {
        "name": "Bangkok", "country": "Thailand",
        "latitude": 13.7563, "longitude": 100.5018,
        "cost_index": 35.0, "popularity": 92,
        "image_url": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80",
        "activities": [
            ("Grand Palace and Wat Pho", "sightseeing", "16.00", 3.5),
            ("Chinatown street food crawl", "food", "20.00", 3.0),
            ("Bang Krachao jungle cycling", "adventure", "28.00", 4.0),
            ("BTS Skytrain day pass", "transport", "4.50", 0.5),
            ("Riverside hotel, Silom", "stay", "65.00", 24.0),
            ("Muay Thai at Rajadamnern", "other", "42.00", 3.0),
        ],
    },
    {
        "name": "New York", "country": "United States",
        "latitude": 40.7128, "longitude": -74.0060,
        "cost_index": 100.0, "popularity": 96,
        "image_url": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
        "activities": [
            ("Metropolitan Museum of Art", "sightseeing", "30.00", 3.0),
            ("Lower East Side food tour", "food", "70.00", 3.0),
            ("Hudson River kayaking", "adventure", "40.00", 2.0),
            ("MetroCard 7-day unlimited", "transport", "34.00", 0.5),
            ("Midtown hotel", "stay", "260.00", 24.0),
            ("Broadway evening show", "other", "120.00", 2.5),
        ],
    },
    {
        "name": "Reykjavik", "country": "Iceland",
        "latitude": 64.1466, "longitude": -21.9426,
        "cost_index": 105.0, "popularity": 78,
        "image_url": "https://images.unsplash.com/photo-1474690870753-1b92efa1f2d8?w=800&q=80",
        "activities": [
            ("Hallgrimskirkja and old harbour", "sightseeing", "12.00", 2.0),
            ("Icelandic seafood tasting", "food", "78.00", 2.5),
            ("Golden Circle glacier hike", "adventure", "145.00", 8.0),
            ("Flybus airport transfer", "transport", "30.00", 1.0),
            ("Downtown guesthouse", "stay", "175.00", 24.0),
            ("Sky Lagoon geothermal spa", "other", "65.00", 3.0),
        ],
    },
    {
        "name": "Manaus", "country": "Brazil",
        "latitude": -3.1190, "longitude": -60.0217,
        "cost_index": 45.0, "popularity": 65,
        "image_url": "https://images.unsplash.com/photo-1544989164-31e89a5a37dc?w=800&q=80",
        "activities": [
            ("Amazon Theatre", "sightseeing", "15.00", 2.0),
            ("Adolpho Lisboa Market tasting", "food", "20.00", 2.0),
            ("Jungle lodge river trek", "adventure", "90.00", 8.0),
            ("River boat day pass", "transport", "10.00", 1.0),
            ("Eco-lodge stay", "stay", "120.00", 24.0),
            ("Meeting of Waters tour", "other", "35.00", 4.0),
        ],
    },
    {
        "name": "Cape Town", "country": "South Africa",
        "latitude": -33.9249, "longitude": 18.4241,
        "cost_index": 60.0, "popularity": 82,
        "image_url": "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80",
        "activities": [
            ("Robben Island Museum", "sightseeing", "40.00", 4.0),
            ("Bo-Kaap Cape Malay cooking", "food", "45.00", 3.0),
            ("Table Mountain hike", "adventure", "0.00", 4.0),
            ("MyCiTi bus pass", "transport", "8.00", 1.0),
            ("Camps Bay boutique hotel", "stay", "150.00", 24.0),
            ("Kirstenbosch canopy walk", "other", "15.00", 2.0),
        ],
    },
    {
        "name": "Sydney", "country": "Australia",
        "latitude": -33.8688, "longitude": 151.2093,
        "cost_index": 95.0, "popularity": 88,
        "image_url": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80",
        "activities": [
            ("Sydney Opera House tour", "sightseeing", "32.00", 2.0),
            ("Sydney Fish Market lunch", "food", "40.00", 2.0),
            ("Bondi to Coogee coastal walk", "adventure", "0.00", 3.0),
            ("Opal daily cap", "transport", "11.00", 1.0),
            ("Darling Harbour hotel", "stay", "200.00", 24.0),
            ("Harbour Bridge climb", "other", "220.00", 3.5),
        ],
    },
    {
        "name": "Rio de Janeiro", "country": "Brazil",
        "latitude": -22.9068, "longitude": -43.1729,
        "cost_index": 55.0, "popularity": 85,
        "image_url": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80",
        "activities": [
            ("Christ the Redeemer", "sightseeing", "25.00", 3.0),
            ("Churrascaria experience", "food", "50.00", 2.5),
            ("Sugarloaf Mountain cable car", "adventure", "30.00", 3.0),
            ("MetroRio card", "transport", "5.00", 1.0),
            ("Copacabana beachfront hotel", "stay", "140.00", 24.0),
            ("Samba club in Lapa", "other", "20.00", 4.0),
        ],
    },
    {
        "name": "Dubai", "country": "United Arab Emirates",
        "latitude": 25.2048, "longitude": 55.2708,
        "cost_index": 90.0, "popularity": 87,
        "image_url": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
        "activities": [
            ("Burj Khalifa observation deck", "sightseeing", "45.00", 2.0),
            ("Al Fahidi street food tour", "food", "40.00", 3.0),
            ("Desert safari and dune bashing", "adventure", "85.00", 6.0),
            ("Nol card day pass", "transport", "6.00", 1.0),
            ("Marina luxury apartment", "stay", "250.00", 24.0),
            ("Dubai Fountain show", "other", "0.00", 1.0),
        ],
    }
]


async def seed(session: AsyncSession) -> tuple[int, int]:
    """Insert any missing cities/activities. Returns (cities_added, activities_added)."""
    cities_added = 0
    activities_added = 0

    for entry in CATALOG:
        # A city with no coordinates is worse than no city at all (§8).
        assert entry["latitude"] is not None and entry["longitude"] is not None, (
            f"{entry['name']} is missing coordinates"
        )

        result = await session.execute(
            select(City).where(City.name == entry["name"], City.country == entry["country"])
        )
        city = result.scalar_one_or_none()
        if city is None:
            city = City(
                name=entry["name"],
                country=entry["country"],
                latitude=entry["latitude"],
                longitude=entry["longitude"],
                cost_index=entry["cost_index"],
                popularity=entry["popularity"],
                image_url=entry.get("image_url"),
            )
            session.add(city)
            await session.flush()
            cities_added += 1
        else:
            # Backfill image_url for cities that already exist without one.
            if city.image_url is None and entry.get("image_url"):
                city.image_url = entry["image_url"]

        existing_names = set(
            (
                await session.execute(select(Activity.name).where(Activity.city_id == city.id))
            ).scalars()
        )

        for name, category, cost, duration in entry["activities"]:
            if name in existing_names:
                continue
            session.add(
                Activity(
                    name=name,
                    city_id=city.id,
                    category=ActivityCategory(category),
                    cost=Decimal(cost),
                    duration_hours=duration,
                )
            )
            activities_added += 1

    await session.commit()
    return cities_added, activities_added


async def main() -> None:
    async with AsyncSessionLocal() as session:
        cities_added, activities_added = await seed(session)
    print(f"Seed complete: +{cities_added} cities, +{activities_added} activities.")


if __name__ == "__main__":
    asyncio.run(main())
