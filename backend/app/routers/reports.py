import csv
import io
import calendar
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import date
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.finance import Income, Expense, SavingsGoal, Investment, SavingsContribution
from app.models.habits import Habit, HabitCompletion

router = APIRouter(prefix="/api/reports", tags=["reports"])


async def get_monthly_data(user_id: int, year: int, month: int, db: AsyncSession):
    first_day = date(year, month, 1)
    last_day = date(year, month, calendar.monthrange(year, month)[1])

    inc_r = await db.execute(
        select(func.sum(Income.amount)).where(
            and_(Income.user_id == user_id, Income.date >= first_day, Income.date <= last_day)
        )
    )
    total_income = inc_r.scalar() or 0.0

    exp_r = await db.execute(
        select(func.sum(Expense.amount)).where(
            and_(Expense.user_id == user_id, Expense.date >= first_day, Expense.date <= last_day)
        )
    )
    total_expenses = exp_r.scalar() or 0.0

    sav_r = await db.execute(
        select(func.sum(SavingsContribution.amount)).where(
            and_(SavingsContribution.user_id == user_id,
                 SavingsContribution.date >= first_day,
                 SavingsContribution.date <= last_day)
        )
    )
    total_savings = sav_r.scalar() or 0.0

    # Expense by category
    cat_r = await db.execute(
        select(Expense.category, func.sum(Expense.amount)).where(
            and_(Expense.user_id == user_id, Expense.date >= first_day, Expense.date <= last_day)
        ).group_by(Expense.category)
    )
    expense_by_category = {r[0]: r[1] for r in cat_r.all()}

    # Essential vs non-essential
    ess_r = await db.execute(
        select(Expense.is_essential, func.sum(Expense.amount)).where(
            and_(Expense.user_id == user_id, Expense.date >= first_day, Expense.date <= last_day)
        ).group_by(Expense.is_essential)
    )
    essential_map = {r[0]: r[1] for r in ess_r.all()}

    net_cash_flow = total_income - total_expenses
    savings_rate = (net_cash_flow / total_income * 100) if total_income > 0 else 0.0

    highest_category = max(expense_by_category, key=expense_by_category.get) if expense_by_category else None

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "total_savings": total_savings,
        "net_cash_flow": net_cash_flow,
        "savings_rate": round(savings_rate, 2),
        "expense_by_category": [{"category": k, "amount": v} for k, v in expense_by_category.items()],
        "essential_spending": essential_map.get(True, 0),
        "non_essential_spending": essential_map.get(False, 0),
        "highest_expense_category": highest_category,
    }


@router.get("")
async def get_report(
    month: Optional[int] = None,
    year: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    m = month or today.month
    y = year or today.year

    current_data = await get_monthly_data(current_user.id, y, m, db)

    # Previous month for comparison
    prev_month = m - 1 if m > 1 else 12
    prev_year = y if m > 1 else y - 1
    prev_data = await get_monthly_data(current_user.id, prev_year, prev_month, db)

    # Investment summary
    inv_r = await db.execute(
        select(func.sum(Investment.amount_invested), func.sum(Investment.current_value))
        .where(Investment.user_id == current_user.id)
    )
    inv_row = inv_r.first()
    total_invested = inv_row[0] or 0.0
    total_inv_value = inv_row[1] or 0.0

    # Habit completion rate this month
    first_day = date(y, m, 1)
    last_day = date(y, m, calendar.monthrange(y, m)[1])
    habits_result = await db.execute(
        select(func.count(Habit.id)).where(
            and_(Habit.user_id == current_user.id, Habit.is_active == True)
        )
    )
    active_habits = habits_result.scalar() or 0

    completions_result = await db.execute(
        select(func.count(HabitCompletion.id)).where(
            and_(
                HabitCompletion.user_id == current_user.id,
                HabitCompletion.completion_date >= first_day,
                HabitCompletion.completion_date <= last_day,
            )
        )
    )
    total_completions = completions_result.scalar() or 0
    days_in_month = calendar.monthrange(y, m)[1]
    expected = active_habits * days_in_month if active_habits > 0 else 1
    habit_completion_rate = min(100.0, total_completions / expected * 100)

    # Monthly trend (last 6 months)
    monthly_trend = []
    for i in range(5, -1, -1):
        tm = ((m - 1 - i) % 12) + 1
        ty = y - ((i - m + 1 + 12) // 12) if (m - 1 - i) < 0 else y
        # Simpler calc:
        month_offset = m - i - 1
        if month_offset <= 0:
            tm = 12 + month_offset
            ty = y - 1
        else:
            tm = month_offset
            ty = y
        data = await get_monthly_data(current_user.id, ty, tm, db)
        monthly_trend.append({
            "month": f"{calendar.month_abbr[tm]} {ty}",
            **data,
        })

    return {
        "period": {"month": m, "year": y},
        "summary": current_data,
        "previous_month": prev_data,
        "investment_summary": {
            "total_invested": total_invested,
            "current_value": total_inv_value,
            "profit_loss": total_inv_value - total_invested,
        },
        "habit_completion_rate": round(habit_completion_rate, 1),
        "monthly_trend": monthly_trend,
    }


@router.get("/export")
async def export_csv(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    m = month or today.month
    y = year or today.year
    first_day = date(y, m, 1)
    last_day = date(y, m, calendar.monthrange(y, m)[1])

    rows = []
    rows.append(["Date", "Type", "Title", "Category", "Amount", "Payment Method", "Description"])

    inc_r = await db.execute(
        select(Income).where(
            and_(Income.user_id == current_user.id, Income.date >= first_day, Income.date <= last_day)
        ).order_by(Income.date)
    )
    for i in inc_r.scalars().all():
        rows.append([str(i.date), "Income", i.source, i.category, i.amount, "", i.description or ""])

    exp_r = await db.execute(
        select(Expense).where(
            and_(Expense.user_id == current_user.id, Expense.date >= first_day, Expense.date <= last_day)
        ).order_by(Expense.date)
    )
    for e in exp_r.scalars().all():
        rows.append([str(e.date), "Expense", e.title, e.category, e.amount, e.payment_method, e.description or ""])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerows(rows)
    output.seek(0)

    filename = f"fingrow_report_{y}_{m:02d}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
