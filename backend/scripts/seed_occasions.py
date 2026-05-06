"""
Week 2 deliverable: Seed the Calgary occasions calendar into the database.
Run: python -m scripts.seed_occasions
"""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import AsyncSessionLocal, create_tables
from app.models.market import CalgaryOccasion


async def seed():
    data_path = Path(__file__).parent.parent / "data" / "calgary_occasions.json"
    with open(data_path) as f:
        data = json.load(f)

    await create_tables()

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select, func
        result = await db.execute(select(func.count()).select_from(CalgaryOccasion))
        count = result.scalar()
        if count > 0:
            print(f"Already seeded {count} occasions. Use --force to re-seed.")
            return

        occasions = []
        for occ in data["occasions"]:
            occasions.append(
                CalgaryOccasion(
                    name=occ["name"],
                    slug=occ["slug"],
                    category=occ["category"],
                    month=occ.get("month"),
                    day=occ.get("day"),
                    is_fixed_date=occ.get("is_fixed_date", True),
                    recurrence_rule=occ.get("recurrence_rule"),
                    relevance_restaurant=occ.get("relevance_restaurant", 0.5),
                    relevance_cafe=occ.get("relevance_cafe", 0.5),
                    relevance_bar=occ.get("relevance_bar", 0.5),
                    relevance_retail=occ.get("relevance_retail", 0.3),
                    relevance_fitness=occ.get("relevance_fitness", 0.3),
                    demand_signal=occ.get("demand_signal", "medium"),
                    lead_time_days=occ.get("lead_time_days", 7),
                    calgary_notes=occ.get("calgary_notes"),
                    is_active=True,
                )
            )

        db.add_all(occasions)
        await db.commit()
        print(f"Seeded {len(occasions)} Calgary occasions.")


if __name__ == "__main__":
    asyncio.run(seed())
