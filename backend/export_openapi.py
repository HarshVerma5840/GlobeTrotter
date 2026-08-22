"""
Freeze the live API contract to `contract/openapi.json`.

Run this after ANY change to a route, schema, or response model:

    cd backend && python export_openapi.py
    cd ../frontend && npm run gen:types

That two-step is the whole anti-drift mechanism (INTEGRATION.md §2): the
backend is the single source of truth, `contract/openapi.json` is the
frozen snapshot of it, and the frontend's TypeScript types are generated
from that snapshot. A field the backend doesn't return cannot appear in
the frontend's types, so a screen that reads it fails at `npm run
typecheck` rather than at the demo.

Writes sorted, indented JSON so a contract change shows up as a readable
diff instead of a one-line churn.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from app.main import app

OUTPUT = Path(__file__).resolve().parent.parent / "contract" / "openapi.json"


def main() -> int:
    schema = app.openapi()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    new = json.dumps(schema, indent=2, sort_keys=True) + "\n"
    previous = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else None

    OUTPUT.write_text(new, encoding="utf-8")

    paths = len(schema.get("paths", {}))
    schemas = len(schema.get("components", {}).get("schemas", {}))
    status = "unchanged" if previous == new else ("created" if previous is None else "UPDATED")
    print(f"{OUTPUT.relative_to(OUTPUT.parent.parent)}: {status} — {paths} paths, {schemas} schemas")

    if status == "UPDATED":
        print("Contract changed. Run `npm run gen:types` in frontend/ before writing UI code.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
