from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.user import User
from app.models.habits import Badge, UserBadge, Habit
from app.models.finance import Expense, Income


BADGE_TRIGGERS = {
    "first_login": {"name": "Welcome to FinGrow!", "icon": "🎉", "points": 10},
    "first_expense": {"name": "First Expense Recorded", "icon": "💸", "points": 10},
    "seven_day_streak": {"name": "7-Day Streak", "icon": "🔥", "points": 50},
    "thirty_day_streak": {"name": "30-Day Streak", "icon": "🏅", "points": 150},
    "savings_starter": {"name": "Savings Starter", "icon": "🏦", "points": 25},
    "goal_achiever": {"name": "Goal Achiever", "icon": "🎯", "points": 100},
    "challenge_champion": {"name": "Challenge Champion", "icon": "🏆", "points": 75},
    "consistent_tracker": {"name": "Consistent Tracker", "icon": "📊", "points": 50},
    "smart_spender": {"name": "Smart Spender", "icon": "🧠", "points": 30},
    "first_income": {"name": "First Income Added", "icon": "💰", "points": 10},
    "investor": {"name": "Investor", "icon": "📈", "points": 40},
}


async def _get_or_create_badge(trigger: str, db: AsyncSession) -> Badge:
    result = await db.execute(select(Badge).where(Badge.trigger == trigger))
    badge = result.scalar_one_or_none()
    if not badge:
        meta = BADGE_TRIGGERS.get(trigger, {"name": trigger, "icon": "⭐", "points": 10})
        badge = Badge(
            name=meta["name"],
            description=f"Awarded for: {trigger}",
            icon=meta["icon"],
            points_required=0,
            trigger=trigger,
        )
        db.add(badge)
        await db.flush()
    return badge


async def award_badge(user_id: int, trigger: str, db: AsyncSession):
    """Award a badge to a user if they don't already have it."""
    badge = await _get_or_create_badge(trigger, db)

    existing = await db.execute(
        select(UserBadge).where(
            and_(UserBadge.user_id == user_id, UserBadge.badge_id == badge.id)
        )
    )
    if existing.scalar_one_or_none():
        return  # Already has this badge

    user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
    db.add(user_badge)

    # Award points
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user:
        meta = BADGE_TRIGGERS.get(trigger, {"points": 10})
        user.points = (user.points or 0) + meta["points"]

    await db.commit()


async def check_and_award_expense_badges(user_id: int, db: AsyncSession):
    """Award first expense badge."""
    count_r = await db.execute(
        select(func.count(Expense.id)).where(Expense.user_id == user_id)
    )
    count = count_r.scalar() or 0
    if count == 1:
        await award_badge(user_id, "first_expense", db)
    if count >= 30:
        await award_badge(user_id, "consistent_tracker", db)


async def check_and_award_income_badges(user_id: int, db: AsyncSession):
    """Award first income badge."""
    count_r = await db.execute(
        select(func.count(Income.id)).where(Income.user_id == user_id)
    )
    count = count_r.scalar() or 0
    if count == 1:
        await award_badge(user_id, "first_income", db)


async def check_and_award_habit_badges(user: User, habit, db: AsyncSession):
    """Award habit-related badges and points."""
    # +5 points per completion
    user.points = (user.points or 0) + 5

    if habit.current_streak >= 7:
        await award_badge(user.id, "seven_day_streak", db)
    if habit.current_streak >= 30:
        await award_badge(user.id, "thirty_day_streak", db)

    await db.commit()


async def check_and_award_goal_badges(user_id: int, goal, db: AsyncSession):
    """Award savings goal badges."""
    if goal.current_amount > 0:
        await award_badge(user_id, "savings_starter", db)
    if goal.current_amount >= goal.target_amount:
        await award_badge(user_id, "goal_achiever", db)


async def award_challenge_completion(user: User, challenge, db: AsyncSession):
    """Award points and badge on challenge completion."""
    user.points = (user.points or 0) + challenge.reward_points
    await award_badge(user.id, "challenge_champion", db)
    await db.commit()
