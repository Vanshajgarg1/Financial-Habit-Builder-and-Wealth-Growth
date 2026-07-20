from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.habits import Habit, HabitCompletion


def compute_period_key(frequency: str, for_date: date) -> str:
    """Return a unique string key for the habit's required period."""
    if frequency == "daily":
        return for_date.isoformat()
    elif frequency == "weekly":
        iso = for_date.isocalendar()
        return f"{iso.year}-W{iso.week:02d}"
    elif frequency == "monthly":
        return f"{for_date.year}-{for_date.month:02d}"
    return for_date.isoformat()


async def recalculate_streak(habit: Habit, db: AsyncSession):
    """Recompute current_streak and longest_streak for a habit."""
    result = await db.execute(
        select(HabitCompletion)
        .where(HabitCompletion.habit_id == habit.id)
        .order_by(HabitCompletion.completion_date.desc())
    )
    completions = result.scalars().all()

    if not completions:
        habit.current_streak = 0
        return

    # Sort period keys descending
    period_keys = sorted({c.period_key for c in completions}, reverse=True)
    today = date.today()
    today_key = compute_period_key(habit.frequency, today)

    current_streak = 0
    longest_streak = 0
    streak = 0
    expected_key = today_key

    for pk in period_keys:
        if pk == expected_key:
            streak += 1
            expected_key = _prev_period_key(habit.frequency, expected_key)
        else:
            longest_streak = max(longest_streak, streak)
            streak = 0
            # Don't break — find longest streak overall
            if pk == expected_key:
                streak = 1

    longest_streak = max(longest_streak, streak)

    # Current streak only counts if today or yesterday/last period is included
    if period_keys and period_keys[0] == today_key:
        # Count forward from today
        cs = 0
        exp = today_key
        for pk in period_keys:
            if pk == exp:
                cs += 1
                exp = _prev_period_key(habit.frequency, exp)
            else:
                break
        current_streak = cs
    else:
        current_streak = 0  # Streak broken

    habit.current_streak = current_streak
    habit.longest_streak = max(habit.longest_streak or 0, longest_streak)


def _prev_period_key(frequency: str, key: str) -> str:
    """Get the previous period key."""
    from datetime import timedelta
    if frequency == "daily":
        d = date.fromisoformat(key)
        prev = d - timedelta(days=1)
        return prev.isoformat()
    elif frequency == "weekly":
        # Parse YYYY-Www
        year, week_str = key.split("-W")
        year = int(year)
        week = int(week_str)
        if week == 1:
            # Go to last week of previous year
            prev_year_last = date(year - 1, 12, 28)
            iso = prev_year_last.isocalendar()
            return f"{iso.year}-W{iso.week:02d}"
        return f"{year}-W{week - 1:02d}"
    elif frequency == "monthly":
        year, month = key.split("-")
        year, month = int(year), int(month)
        if month == 1:
            return f"{year - 1}-12"
        return f"{year}-{month - 1:02d}"
    return key
