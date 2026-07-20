import calendar
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.finance import Income, Expense, SavingsGoal, Investment, SavingsContribution
from app.models.habits import Habit, HabitCompletion


async def generate_insights(user_id: int, db: AsyncSession) -> list[dict]:
    """Generate rule-based financial insights from the user's data."""
    insights = []
    today = date.today()
    m = today.month
    y = today.year

    first_day = date(y, m, 1)
    last_day = date(y, m, calendar.monthrange(y, m)[1])

    # Previous month
    prev_m = m - 1 if m > 1 else 12
    prev_y = y if m > 1 else y - 1
    prev_first = date(prev_y, prev_m, 1)
    prev_last = date(prev_y, prev_m, calendar.monthrange(prev_y, prev_m)[1])

    # Current month income and expenses
    cur_inc = await db.execute(
        select(func.sum(Income.amount)).where(
            and_(Income.user_id == user_id, Income.date >= first_day, Income.date <= last_day)
        )
    )
    cur_income = cur_inc.scalar() or 0.0

    cur_exp = await db.execute(
        select(func.sum(Expense.amount)).where(
            and_(Expense.user_id == user_id, Expense.date >= first_day, Expense.date <= last_day)
        )
    )
    cur_expenses = cur_exp.scalar() or 0.0

    # Previous month expenses
    prev_exp = await db.execute(
        select(func.sum(Expense.amount)).where(
            and_(Expense.user_id == user_id, Expense.date >= prev_first, Expense.date <= prev_last)
        )
    )
    prev_expenses = prev_exp.scalar() or 0.0

    # Savings rate
    if cur_income > 0:
        savings_rate = (cur_income - cur_expenses) / cur_income * 100
        insights.append({
            "type": "savings_rate",
            "icon": "💰",
            "text": f"You saved {savings_rate:.1f}% of your income this month.",
            "sentiment": "positive" if savings_rate >= 20 else "neutral" if savings_rate >= 10 else "warning",
        })

    # Expense change vs last month
    if prev_expenses > 0 and cur_expenses > 0:
        change_pct = (cur_expenses - prev_expenses) / prev_expenses * 100
        if abs(change_pct) > 5:
            direction = "increased" if change_pct > 0 else "decreased"
            insights.append({
                "type": "expense_change",
                "icon": "📊",
                "text": f"Your expenses {direction} by {abs(change_pct):.1f}% compared to last month.",
                "sentiment": "warning" if change_pct > 0 else "positive",
            })

    # Highest expense category
    cat_result = await db.execute(
        select(Expense.category, func.sum(Expense.amount)).where(
            and_(Expense.user_id == user_id, Expense.date >= first_day, Expense.date <= last_day)
        ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).limit(1)
    )
    top_cat = cat_result.first()
    if top_cat:
        insights.append({
            "type": "top_category",
            "icon": "🏷️",
            "text": f"{top_cat[0]} is your highest spending category this month (₹{top_cat[1]:,.0f}).",
            "sentiment": "neutral",
        })

    # Goals progress
    goals_result = await db.execute(
        select(SavingsGoal).where(
            and_(SavingsGoal.user_id == user_id, SavingsGoal.status.in_(["in_progress", "not_started"]))
        ).limit(1)
    )
    goal = goals_result.scalar_one_or_none()
    if goal and goal.target_amount > goal.current_amount:
        remaining = goal.target_amount - goal.current_amount
        insights.append({
            "type": "goal_progress",
            "icon": "🎯",
            "text": f"You are ₹{remaining:,.0f} away from completing your '{goal.title}' goal.",
            "sentiment": "neutral",
        })
        # Estimate time to reach goal
        monthly_savings = cur_income - cur_expenses
        if monthly_savings > 0:
            months_needed = remaining / monthly_savings
            insights.append({
                "type": "goal_estimate",
                "icon": "📅",
                "text": f"At your current saving rate, you may reach your '{goal.title}' goal in {months_needed:.1f} months.",
                "sentiment": "positive" if months_needed < 12 else "neutral",
            })

    # Habit completion
    habits_result = await db.execute(
        select(func.count(Habit.id)).where(
            and_(Habit.user_id == user_id, Habit.is_active == True)
        )
    )
    active_habits = habits_result.scalar() or 0

    completions_result = await db.execute(
        select(func.count(HabitCompletion.id)).where(
            and_(
                HabitCompletion.user_id == user_id,
                HabitCompletion.completion_date >= first_day,
                HabitCompletion.completion_date <= last_day,
            )
        )
    )
    total_completions = completions_result.scalar() or 0

    if active_habits > 0:
        days_elapsed = (today - first_day).days + 1
        expected = active_habits * days_elapsed
        rate = min(100, total_completions / expected * 100) if expected > 0 else 0
        insights.append({
            "type": "habit_completion",
            "icon": "✅",
            "text": f"You completed {rate:.0f}% of your financial habits so far this month.",
            "sentiment": "positive" if rate >= 80 else "neutral" if rate >= 50 else "warning",
        })

    # Non-essential spending
    non_ess_result = await db.execute(
        select(func.sum(Expense.amount)).where(
            and_(
                Expense.user_id == user_id,
                Expense.date >= first_day,
                Expense.date <= last_day,
                Expense.is_essential == False,
            )
        )
    )
    non_essential = non_ess_result.scalar() or 0.0
    if cur_expenses > 0 and non_essential > 0:
        non_ess_pct = non_essential / cur_expenses * 100
        if non_ess_pct > 30:
            insights.append({
                "type": "non_essential",
                "icon": "⚠️",
                "text": f"{non_ess_pct:.0f}% of your spending this month is on non-essential items.",
                "sentiment": "warning",
            })

    return insights
