"""
Unit tests for the auto-plan logic that needs no DB or network (B10).

The two things worth pinning hardest are the day allocation (which the LLM
is deliberately never asked to do) and the validation step that drops
unrecognised ids — CONTRACTS §8 treats LLM output as untrusted input.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional

from app.models.activity import ActivityCategory
from app.services.autoplan import _Candidates, _allocate, _pick_activities, _validate_proposal


@dataclass
class FakeCity:
    id: uuid.UUID = field(default_factory=uuid.uuid4)


@dataclass
class FakeActivity:
    category: ActivityCategory = ActivityCategory.food
    cost: Optional[Decimal] = Decimal("10.00")
    name: str = "thing"
    id: uuid.UUID = field(default_factory=uuid.uuid4)


# --- day allocation -------------------------------------------------------


def test_allocate_covers_every_day_exactly_once() -> None:
    start = date(2026, 6, 1)
    ranges = _allocate(start, 10, 3)
    assert len(ranges) == 3
    covered: List[date] = []
    for s, e in ranges:
        covered.extend(s + timedelta(days=i) for i in range((e - s).days + 1))
    assert len(covered) == 10
    assert len(set(covered)) == 10  # no day allocated twice
    assert min(covered) == start and max(covered) == start + timedelta(days=9)


def test_allocate_ranges_never_overlap_and_leave_a_travel_day() -> None:
    ranges = _allocate(date(2026, 6, 1), 9, 3)
    for (_, prev_end), (next_start, _) in zip(ranges, ranges[1:]):
        # Next city starts the day AFTER the previous ends: a real gap, so
        # the §7.2 feasibility check has something sane to measure.
        assert next_start == prev_end + timedelta(days=1)


def test_allocate_single_city_takes_the_whole_window() -> None:
    ranges = _allocate(date(2026, 6, 1), 4, 1)
    assert ranges == [(date(2026, 6, 1), date(2026, 6, 4))]


def test_allocate_spreads_remainder_to_the_earlier_cities() -> None:
    # 7 days over 2 cities -> 4 then 3, never 3 then 3 with a day lost.
    ranges = _allocate(date(2026, 6, 1), 7, 2)
    lengths = [(e - s).days + 1 for s, e in ranges]
    assert lengths == [4, 3]
    assert sum(lengths) == 7


# --- LLM output validation ------------------------------------------------


def _candidates() -> tuple[_Candidates, FakeCity, FakeActivity]:
    city = FakeCity()
    activity = FakeActivity()
    return (
        _Candidates(cities=[city], activities_by_city={city.id: [activity]}),
        city,
        activity,
    )


def test_validate_keeps_known_ids() -> None:
    cands, city, activity = _candidates()
    out = _validate_proposal(
        {"stops": [{"city_id": str(city.id), "activity_ids": [str(activity.id)]}]}, cands
    )
    assert len(out) == 1
    assert out[0][0] is city
    assert out[0][1] == [activity]


def test_validate_drops_hallucinated_city() -> None:
    cands, _, _ = _candidates()
    out = _validate_proposal({"stops": [{"city_id": str(uuid.uuid4()), "activity_ids": []}]}, cands)
    assert out == []


def test_validate_drops_hallucinated_activity_but_keeps_the_city() -> None:
    cands, city, _ = _candidates()
    out = _validate_proposal(
        {"stops": [{"city_id": str(city.id), "activity_ids": [str(uuid.uuid4())]}]}, cands
    )
    assert len(out) == 1 and out[0][1] == []


def test_validate_drops_activity_belonging_to_another_city() -> None:
    """A real id from the wrong city is still an invalid answer."""
    cands, city, _ = _candidates()
    other = FakeActivity()
    cands.cities.append(FakeCity())
    cands.activities_by_city[cands.cities[-1].id] = [other]
    out = _validate_proposal(
        {"stops": [{"city_id": str(city.id), "activity_ids": [str(other.id)]}]}, cands
    )
    assert out[0][1] == []


def test_validate_survives_garbage_input() -> None:
    cands, _, _ = _candidates()
    for junk in (None, {}, {"stops": None}, {"stops": ["nope"]}, {"stops": [{"city_id": "xyz"}]}):
        assert _validate_proposal(junk, cands) == []


def test_validate_ignores_a_repeated_city() -> None:
    cands, city, _ = _candidates()
    out = _validate_proposal(
        {"stops": [{"city_id": str(city.id)}, {"city_id": str(city.id)}]}, cands
    )
    assert len(out) == 1


# --- activity selection ---------------------------------------------------


def test_pick_respects_budget_cap() -> None:
    """CONTRACTS §7.1 treats budget_target as a cap, not a hint."""
    pool = [FakeActivity(cost=Decimal("500.00")), FakeActivity(cost=Decimal("5.00"))]
    picked = _pick_activities(pool, [], slots=2, used=set(), remaining_budget=Decimal("10.00"))
    assert [p.cost for p in picked] == [Decimal("5.00")]


def test_pick_skips_already_used_activities() -> None:
    a, b = FakeActivity(), FakeActivity()
    used = {a.id}
    picked = _pick_activities([a, b], [], slots=5, used=used, remaining_budget=None)
    assert picked == [b]


def test_pick_prefers_interest_categories_over_cheapness() -> None:
    cheap_other = FakeActivity(category=ActivityCategory.other, cost=Decimal("1.00"))
    pricier_match = FakeActivity(category=ActivityCategory.food, cost=Decimal("50.00"))
    picked = _pick_activities(
        [cheap_other, pricier_match],
        [ActivityCategory.food],
        slots=1,
        used=set(),
        remaining_budget=None,
    )
    assert picked == [pricier_match]


def test_pick_handles_free_activities() -> None:
    free = FakeActivity(cost=None)
    picked = _pick_activities([free], [], slots=1, used=set(), remaining_budget=Decimal("0.00"))
    assert picked == [free]
