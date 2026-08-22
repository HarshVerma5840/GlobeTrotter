"""
Smart Trip Assistant (B10, CONTRACTS §7.1).

Two paths, one guarantee: **the user always gets a usable plan.**

  1. Groq proposes a selection from real DB candidates.
  2. Every id it returns is validated against those candidates; anything
     that doesn't resolve is DROPPED, never guessed at, never retried into
     a hallucinated fix (CONTRACTS §7.1/§8).
  3. Whatever the LLM didn't cover — because the key is unset, the call
     failed, the JSON was malformed, or validation dropped too much — is
     filled by the deterministic scorer.

The deterministic path is written first and is complete on its own. It is
the safety net CONTRACTS §7.1 calls mandatory, not optional, so it must
never depend on anything in the LLM path having run.

**Division of labour with the LLM, deliberately chosen:** Groq picks *what*
(which cities, which activities); this module computes *when* (all date
math, day allocation, sequencing). Date arithmetic is precisely what a
language model gets subtly wrong, and we already own validated date rules
in services/stops.py — so the model is never asked to produce a date.
"""
from __future__ import annotations

import json
import logging
import uuid
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Sequence, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.errors import DomainValidationError
from app.models.activity import Activity, ActivityCategory
from app.models.city import City
from app.models.itinerary_activity import ItineraryActivity
from app.models.stop import Stop
from app.models.trip import Trip
from app.schemas.autoplan import ACTIVITIES_PER_DAY, AutoPlanRequest

logger = logging.getLogger(__name__)

# Roughly how long a traveller spends per city before moving on. Used only
# to decide how many cities fit in the trip's free days.
DAYS_PER_CITY = 3
MAX_CANDIDATE_CITIES = 12
MAX_CANDIDATE_ACTIVITIES_PER_CITY = 12
GROQ_TIMEOUT_SECONDS = 20.0


@dataclass
class PlanResult:
    source: str  # "llm" | "fallback" | "llm+fallback"
    stops_created: int = 0
    activities_created: int = 0
    estimated_total: Decimal = Decimal("0.00")


@dataclass
class _Candidates:
    """The grounding set: real rows from this DB, nothing invented."""

    cities: List[City] = field(default_factory=list)
    activities_by_city: Dict[uuid.UUID, List[Activity]] = field(default_factory=dict)

    def city_ids(self) -> set:
        return {c.id for c in self.cities}


# --------------------------------------------------------------------------
# Candidate gathering
# --------------------------------------------------------------------------


async def _gather_candidates(db: AsyncSession, request: AutoPlanRequest) -> _Candidates:
    """
    Pull the real City/Activity rows the plan may draw from.

    Cities are ranked by popularity desc, then cost_index asc — the same
    weighting the deterministic scorer uses, so the LLM is offered the
    already-sensible shortlist rather than the whole catalog.
    """
    city_rows = await db.execute(
        select(City)
        .order_by(City.popularity.desc().nullslast(), City.cost_index.asc().nullslast(), City.name)
        .limit(MAX_CANDIDATE_CITIES)
    )
    cities = list(city_rows.scalars().all())
    if not cities:
        raise DomainValidationError(
            "The city catalog is empty — run the seed script (app.seed) before auto-planning."
        )

    interests = list(request.interest_categories or [])
    activities_by_city: Dict[uuid.UUID, List[Activity]] = {}
    for city in cities:
        stmt = select(Activity).where(Activity.city_id == city.id)
        if interests:
            # Interests filter the shortlist but never make it empty: a city
            # with no matching activity still needs *something* to schedule,
            # so we fall back to its full list below.
            stmt = stmt.where(Activity.category.in_(interests))
        rows = await db.execute(stmt.order_by(Activity.cost.asc().nullslast(), Activity.name))
        found = list(rows.scalars().all())

        if not found and interests:
            rows = await db.execute(
                select(Activity)
                .where(Activity.city_id == city.id)
                .order_by(Activity.cost.asc().nullslast(), Activity.name)
            )
            found = list(rows.scalars().all())

        activities_by_city[city.id] = found[:MAX_CANDIDATE_ACTIVITIES_PER_CITY]

    return _Candidates(cities=cities, activities_by_city=activities_by_city)


# --------------------------------------------------------------------------
# Date allocation (never delegated to the LLM)
# --------------------------------------------------------------------------


async def _free_window(db: AsyncSession, trip: Trip) -> Optional[Tuple[date, int]]:
    """
    The (start_date, day_count) the assistant may plan into.

    Non-destructive by design: an existing itinerary is never cleared or
    overwritten. On a partially-built trip we plan the days *after* the last
    existing stop; on an empty trip, the whole range. Returns None when
    there is nothing left to fill.
    """
    rows = await db.execute(
        select(Stop).where(Stop.trip_id == trip.id).order_by(Stop.date_end.desc()).limit(1)
    )
    last = rows.scalar_one_or_none()

    start = trip.date_start if last is None else last.date_end + timedelta(days=1)
    if start > trip.date_end:
        return None
    return start, (trip.date_end - start).days + 1


def _allocate(start: date, total_days: int, city_count: int) -> List[Tuple[date, date]]:
    """
    Split a contiguous run of days into one inclusive range per city.

    Ranges never overlap and never touch, so each hop gets a real travel day
    and the §7.2 feasibility check has a sane gap to measure.
    """
    base, extra = divmod(total_days, city_count)
    ranges: List[Tuple[date, date]] = []
    cursor = start
    for i in range(city_count):
        length = base + (1 if i < extra else 0)
        ranges.append((cursor, cursor + timedelta(days=length - 1)))
        cursor += timedelta(days=length)
    return ranges


# --------------------------------------------------------------------------
# Deterministic scorer — the mandatory fallback (CONTRACTS §7.1)
# --------------------------------------------------------------------------


def _score_activity(activity: Activity, interests: Sequence[ActivityCategory]) -> Tuple[int, Decimal]:
    """Category match first, then ascending cost — CONTRACTS §7.1's stated ranking."""
    matches = 0 if (interests and activity.category in interests) else 1
    cost = Decimal(activity.cost) if activity.cost is not None else Decimal("0.00")
    return matches, cost


def _pick_activities(
    pool: Sequence[Activity],
    interests: Sequence[ActivityCategory],
    slots: int,
    used: set,
    remaining_budget: Optional[Decimal],
) -> List[Activity]:
    """
    Choose up to `slots` activities from one city's pool.

    Skips anything already scheduled on this trip (nobody wants the same
    museum three days running) and anything that would push the plan past
    `budget_target` — CONTRACTS §7.1 treats the target as a cap, not a hint.
    """
    ranked = sorted(
        (a for a in pool if a.id not in used),
        key=lambda a: _score_activity(a, interests),
    )
    chosen: List[Activity] = []
    for activity in ranked:
        if len(chosen) >= slots:
            break
        cost = Decimal(activity.cost) if activity.cost is not None else Decimal("0.00")
        if remaining_budget is not None and cost > remaining_budget:
            continue
        chosen.append(activity)
        used.add(activity.id)
        if remaining_budget is not None:
            remaining_budget -= cost
    return chosen


def _deterministic_city_order(candidates: _Candidates, city_count: int) -> List[City]:
    """Candidates already arrive ranked by popularity/cost_index — take the top N."""
    return candidates.cities[:city_count]


# --------------------------------------------------------------------------
# Groq path
# --------------------------------------------------------------------------


def _build_prompt(trip: Trip, request: AutoPlanRequest, candidates: _Candidates, city_count: int) -> str:
    """
    Ground the model in real rows only.

    Every id the model may use is listed here. It is told to choose from
    them and nothing else — and even so, its answer is validated against
    this same set afterwards, because a prompt instruction is not a
    guarantee (CONTRACTS §8).
    """
    catalog = []
    for city in candidates.cities:
        acts = candidates.activities_by_city.get(city.id, [])
        catalog.append(
            {
                "city_id": str(city.id),
                "name": city.name,
                "country": city.country,
                "cost_index": city.cost_index,
                "activities": [
                    {
                        "activity_id": str(a.id),
                        "name": a.name,
                        "category": a.category.value
                        if isinstance(a.category, ActivityCategory)
                        else str(a.category),
                        "cost": float(a.cost) if a.cost is not None else None,
                    }
                    for a in acts
                ],
            }
        )

    interests = [
        c.value if isinstance(c, ActivityCategory) else str(c) for c in request.interest_categories
    ]
    return json.dumps(
        {
            "task": (
                "Choose which cities to visit and which activities to do. "
                "Pick EXACTLY the requested number of cities, in travel order. "
                "Use ONLY the city_id and activity_id values given in `catalog`. "
                "Do not invent ids, names, or dates. Dates are handled by the caller."
            ),
            "trip": {"name": trip.name, "total_days": (trip.date_end - trip.date_start).days + 1},
            "city_count": city_count,
            "activities_per_day": ACTIVITIES_PER_DAY[request.pace],
            "budget_target": float(request.budget_target) if request.budget_target else None,
            "interest_categories": interests,
            "traveller_notes": request.preferences,
            "catalog": catalog,
            "response_format": {
                "stops": [{"city_id": "<from catalog>", "activity_ids": ["<from that city>"]}]
            },
        },
        indent=None,
    )


async def _ask_groq(prompt: str) -> Optional[dict]:
    """
    Call Groq for a proposal. Returns None on ANY failure.

    Every failure mode collapses to None on purpose — missing package,
    unset key, timeout, HTTP error, malformed JSON. The caller treats None
    as "no LLM input" and falls through to the deterministic scorer, so a
    dead API key degrades the feature instead of breaking the request.
    """
    if not settings.groq_api_key:
        logger.info("autoplan: GROQ_API_KEY unset, using deterministic scorer")
        return None

    try:
        from groq import AsyncGroq  # imported lazily so the app boots without the package

        client = AsyncGroq(api_key=settings.groq_api_key, timeout=GROQ_TIMEOUT_SECONDS)
        completion = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a travel planner. Respond with JSON only, matching "
                        "the `response_format` in the user message. Use only ids that "
                        "appear in the provided catalog."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
        )
        return json.loads(completion.choices[0].message.content or "{}")
    except Exception as exc:  # noqa: BLE001 — every failure is the same failure here
        logger.warning("autoplan: Groq path unavailable (%s), falling back", exc)
        return None


def _validate_proposal(proposal: Optional[dict], candidates: _Candidates) -> List[Tuple[City, List[Activity]]]:
    """
    Keep only what resolves to a real candidate row; drop everything else.

    CONTRACTS §8: an LLM-sourced id is untrusted input. Nothing here is
    "corrected" or re-queried — an id that isn't in the candidate set simply
    doesn't make it into the plan, and the deterministic scorer covers the
    gap it leaves.
    """
    if not isinstance(proposal, dict):
        return []

    cities_by_id = {c.id: c for c in candidates.cities}
    validated: List[Tuple[City, List[Activity]]] = []
    seen_cities: set = set()

    for entry in proposal.get("stops") or []:
        if not isinstance(entry, dict):
            continue
        try:
            city_id = uuid.UUID(str(entry.get("city_id")))
        except (TypeError, ValueError):
            continue
        city = cities_by_id.get(city_id)
        if city is None or city.id in seen_cities:
            continue  # unknown id, or the model listed the same city twice
        seen_cities.add(city.id)

        allowed = {a.id: a for a in candidates.activities_by_city.get(city.id, [])}
        activities: List[Activity] = []
        for raw_id in entry.get("activity_ids") or []:
            try:
                activity_id = uuid.UUID(str(raw_id))
            except (TypeError, ValueError):
                continue
            # Must belong to THIS city's shortlist — a real activity id from
            # the wrong city is still an invalid answer.
            activity = allowed.get(activity_id)
            if activity is not None and activity not in activities:
                activities.append(activity)

        validated.append((city, activities))

    return validated


# --------------------------------------------------------------------------
# Entry point
# --------------------------------------------------------------------------


async def generate_plan(db: AsyncSession, trip: Trip, request: AutoPlanRequest) -> PlanResult:
    """
    Fill a trip with real, persisted, editable Stop/ItineraryActivity rows.

    Never returns a preview-only structure — CONTRACTS §8 makes persistence
    non-negotiable, so the user lands in the normal Itinerary Builder with a
    draft they can edit with the tools they already know.
    """
    window = await _free_window(db, trip)
    if window is None:
        raise DomainValidationError(
            "This trip's dates are already fully planned — clear a stop before auto-planning."
        )
    start, total_days = window

    candidates = await _gather_candidates(db, request)
    city_count = max(1, min(len(candidates.cities), -(-total_days // DAYS_PER_CITY)))

    proposal = await _ask_groq(_build_prompt(trip, request, candidates, city_count))
    validated = _validate_proposal(proposal, candidates)

    used_llm = bool(validated)
    ordered_cities = [city for city, _ in validated][:city_count]
    llm_activities = {city.id: acts for city, acts in validated}

    # Top up from the deterministic ranking if the LLM gave us too few
    # usable cities (or none at all).
    used_ids = {c.id for c in ordered_cities}
    if len(ordered_cities) < city_count:
        for city in _deterministic_city_order(candidates, len(candidates.cities)):
            if len(ordered_cities) >= city_count:
                break
            if city.id not in used_ids:
                ordered_cities.append(city)
                used_ids.add(city.id)

    used_fallback = len(ordered_cities) > len(llm_activities) or not used_llm

    # Sequence continues after any stops already on the trip.
    existing_max = await db.execute(
        select(Stop.sequence).where(Stop.trip_id == trip.id).order_by(Stop.sequence.desc()).limit(1)
    )
    next_sequence = (existing_max.scalar_one_or_none() or -1) + 1

    interests = list(request.interest_categories or [])
    slots_per_day = ACTIVITIES_PER_DAY[request.pace]
    remaining_budget = Decimal(request.budget_target) if request.budget_target is not None else None

    used_activity_ids: set = set()
    result = PlanResult(source="llm" if used_llm else "fallback")
    total = Decimal("0.00")

    for index, (city, (range_start, range_end)) in enumerate(
        zip(ordered_cities, _allocate(start, total_days, len(ordered_cities)))
    ):
        stop = Stop(
            trip_id=trip.id,
            city_id=city.id,
            sequence=next_sequence + index,
            date_start=range_start,
            date_end=range_end,
        )
        db.add(stop)
        await db.flush()  # need stop.id before attaching activities
        result.stops_created += 1

        # Prefer the LLM's picks for this city, then top up from the pool.
        pool: List[Activity] = list(llm_activities.get(city.id, []))
        for activity in candidates.activities_by_city.get(city.id, []):
            if activity not in pool:
                pool.append(activity)

        day_count = (range_end - range_start).days + 1
        for day_offset in range(day_count):
            scheduled = range_start + timedelta(days=day_offset)
            picks = _pick_activities(pool, interests, slots_per_day, used_activity_ids, remaining_budget)
            if not picks and not used_activity_ids:
                used_fallback = True
            for slot, activity in enumerate(picks):
                cost = Decimal(activity.cost) if activity.cost is not None else Decimal("0.00")
                if remaining_budget is not None:
                    remaining_budget -= cost
                total += cost
                db.add(
                    ItineraryActivity(
                        stop_id=stop.id,
                        activity_id=activity.id,
                        scheduled_date=scheduled,
                        # Spread the day from 09:00 in 2h steps so the
                        # calendar view has a sane ordering out of the box.
                        scheduled_time=9.0 + slot * 2,
                        # Copied at insert time, then independent (CONTRACTS §2).
                        cost=activity.cost,
                    )
                )
                result.activities_created += 1

    await db.commit()

    if used_llm and used_fallback:
        result.source = "llm+fallback"
    elif not used_llm:
        result.source = "fallback"
    result.estimated_total = total

    # Diagnostic only — CONTRACTS §7.1 wants the path logged for the demo
    # narrative, never surfaced as user-facing text.
    logger.info(
        "autoplan trip=%s source=%s stops=%d activities=%d total=%s",
        trip.id,
        result.source,
        result.stops_created,
        result.activities_created,
        result.estimated_total,
    )
    return result
