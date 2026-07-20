from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from datetime import date, datetime
from typing import Optional
import calendar

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.finance import Income, Expense, SavingsGoal, Investment, SavingsContribution
from app.models.habits import Habit, HabitCompletion, UserChallenge, Challenge
from app.services.insights import generate_insights

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(
    month: int = Query(default=None),
    year: int = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    m = month or today.month
    y = year or today.year

    first_day = date(y, m, 1)
    last_day = date(y, m, calendar.monthrange(y, m)[1])

    # Monthly income
    income_result = await db.execute(
        select(func.sum(Income.amount)).where(
            and_(Income.user_id == current_user.id, Income.date >= first_day, Income.date <= last_day)
        )
    )
    total_income = income_result.scalar() or 0.0

    # Monthly expenses
    expense_result = await db.execute(
        select(func.sum(Expense.amount)).where(
            and_(Expense.user_id == current_user.id, Expense.date >= first_day, Expense.date <= last_day)
        )
    )
    total_expenses = expense_result.scalar() or 0.0

    # Total savings (all goals current_amount)
    savings_result = await db.execute(
        select(func.sum(SavingsGoal.current_amount)).where(SavingsGoal.user_id == current_user.id)
    )
    total_savings = savings_result.scalar() or 0.0

    # Investments
    inv_result = await db.execute(
        select(func.sum(Investment.amount_invested), func.sum(Investment.current_value))
        .where(Investment.user_id == current_user.id)
    )
    inv_row = inv_result.first()
    total_invested = inv_row[0] or 0.0
    total_inv_value = inv_row[1] or 0.0

    net_worth = total_savings + total_inv_value
    balance = total_income - total_expenses
    savings_rate = ((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0.0

    # Active habit streak (max among active habits)
    habits_result = await db.execute(
        select(func.max(Habit.current_streak)).where(
            and_(Habit.user_id == current_user.id, Habit.is_active == True)
        )
    )
    best_streak = habits_result.scalar() or 0

    # Active goals
    goals_result = await db.execute(
        select(SavingsGoal).where(
            and_(SavingsGoal.user_id == current_user.id, SavingsGoal.status.in_(["in_progress", "not_started"]))
        ).limit(3)
    )
    active_goals = goals_result.scalars().all()

    # Today's habits
    today_habits_result = await db.execute(
        select(Habit).where(
            and_(Habit.user_id == current_user.id, Habit.is_active == True, Habit.frequency == "daily")
        )
    )
    today_habits = today_habits_result.scalars().all()

    # Active challenge
    active_challenge_result = await db.execute(
        select(UserChallenge).where(
            and_(UserChallenge.user_id == current_user.id, UserChallenge.status == "active")
        ).limit(1)
    )
    active_challenge = active_challenge_result.scalar_one_or_none()

    # Recent transactions (last 5)
    recent_inc = await db.execute(
        select(Income).where(Income.user_id == current_user.id).order_by(Income.date.desc()).limit(5)
    )
    recent_exp = await db.execute(
        select(Expense).where(Expense.user_id == current_user.id).order_by(Expense.date.desc()).limit(5)
    )

    inc_list = [{"id": i.id, "type": "income", "amount": i.amount, "title": i.source, "category": i.category, "date": str(i.date)} for i in recent_inc.scalars().all()]
    exp_list = [{"id": e.id, "type": "expense", "amount": e.amount, "title": e.title, "category": e.category, "date": str(e.date)} for e in recent_exp.scalars().all()]
    recent_transactions = sorted(inc_list + exp_list, key=lambda x: x["date"], reverse=True)[:5]

    return {
        "month": m,
        "year": y,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "total_savings": total_savings,
        "total_invested": total_invested,
        "current_portfolio_value": total_inv_value,
        "net_worth": net_worth,
        "balance": balance,
        "savings_rate": round(savings_rate, 2),
        "best_streak": best_streak,
        "points": current_user.points,
        "active_goals": [
            {
                "id": g.id,
                "title": g.title,
                "target_amount": g.target_amount,
                "current_amount": g.current_amount,
                "progress": round((g.current_amount / g.target_amount * 100) if g.target_amount > 0 else 0, 1),
            }
            for g in active_goals
        ],
        "today_habits_count": len(today_habits),
        "active_challenge": {
            "id": active_challenge.id,
            "challenge_id": active_challenge.challenge_id,
            "status": active_challenge.status,
            "current_progress": active_challenge.current_progress,
        } if active_challenge else None,
        "recent_transactions": recent_transactions,
    }


@router.get("/charts")
async def dashboard_charts(
    year: int = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    y = year or date.today().year
    months = []
    for m in range(1, 13):
        first = date(y, m, 1)
        last = date(y, m, calendar.monthrange(y, m)[1])

        inc_r = await db.execute(
            select(func.sum(Income.amount)).where(
                and_(Income.user_id == current_user.id, Income.date >= first, Income.date <= last)
            )
        )
        exp_r = await db.execute(
            select(func.sum(Expense.amount)).where(
                and_(Expense.user_id == current_user.id, Expense.date >= first, Expense.date <= last)
            )
        )
        savings_r = await db.execute(
            select(func.sum(SavingsContribution.amount)).where(
                and_(SavingsContribution.user_id == current_user.id,
                     SavingsContribution.date >= first,
                     SavingsContribution.date <= last)
            )
        )
        months.append({
            "month": calendar.month_abbr[m],
            "income": inc_r.scalar() or 0,
            "expenses": exp_r.scalar() or 0,
            "savings": savings_r.scalar() or 0,
        })

    # Expense by category (current month)
    today = date.today()
    first_day = date(today.year, today.month, 1)
    last_day = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])
    cat_result = await db.execute(
        select(Expense.category, func.sum(Expense.amount)).where(
            and_(Expense.user_id == current_user.id, Expense.date >= first_day, Expense.date <= last_day)
        ).group_by(Expense.category)
    )
    expense_by_category = [{"category": r[0], "amount": r[1]} for r in cat_result.all()]

    # Investment allocation
    inv_result = await db.execute(
        select(Investment.investment_type, func.sum(Investment.current_value)).where(
            Investment.user_id == current_user.id
        ).group_by(Investment.investment_type)
    )
    investment_allocation = [{"type": r[0], "value": r[1]} for r in inv_result.all()]

    return {
        "monthly_trend": months,
        "expense_by_category": expense_by_category,
        "investment_allocation": investment_allocation,
    }


@router.get("/insights")
async def dashboard_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    insights = await generate_insights(current_user.id, db)
    return {"insights": insights}
