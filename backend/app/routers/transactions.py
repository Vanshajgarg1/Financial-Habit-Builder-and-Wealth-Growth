from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.finance import Income, Expense, SavingsContribution, Investment

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("")
async def list_transactions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    transaction_type: Optional[str] = None,  # income, expense, savings, investment
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = Query(default="newest"),  # newest, oldest, highest, lowest
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    transactions = []

    if not transaction_type or transaction_type == "income":
        q = select(Income).where(Income.user_id == current_user.id)
        if start_date:
            q = q.where(Income.date >= start_date)
        if end_date:
            q = q.where(Income.date <= end_date)
        if category:
            q = q.where(Income.category == category)
        if search:
            q = q.where(Income.source.ilike(f"%{search}%"))
        result = await db.execute(q)
        for i in result.scalars().all():
            transactions.append({
                "id": i.id,
                "type": "income",
                "amount": i.amount,
                "title": i.source,
                "category": i.category,
                "date": str(i.date),
                "description": i.description,
                "is_recurring": i.is_recurring,
                "payment_method": None,
                "is_essential": None,
            })

    if not transaction_type or transaction_type == "expense":
        q = select(Expense).where(Expense.user_id == current_user.id)
        if start_date:
            q = q.where(Expense.date >= start_date)
        if end_date:
            q = q.where(Expense.date <= end_date)
        if category:
            q = q.where(Expense.category == category)
        if search:
            q = q.where(Expense.title.ilike(f"%{search}%"))
        result = await db.execute(q)
        for e in result.scalars().all():
            transactions.append({
                "id": e.id,
                "type": "expense",
                "amount": e.amount,
                "title": e.title,
                "category": e.category,
                "date": str(e.date),
                "description": e.description,
                "is_recurring": e.is_recurring,
                "payment_method": e.payment_method,
                "is_essential": e.is_essential,
            })

    if not transaction_type or transaction_type == "savings":
        q = select(SavingsContribution).where(SavingsContribution.user_id == current_user.id)
        if start_date:
            q = q.where(SavingsContribution.date >= start_date)
        if end_date:
            q = q.where(SavingsContribution.date <= end_date)
        result = await db.execute(q)
        for s in result.scalars().all():
            transactions.append({
                "id": s.id,
                "type": "savings",
                "amount": s.amount,
                "title": f"Savings Contribution",
                "category": "savings",
                "date": str(s.date),
                "description": s.note,
                "is_recurring": False,
                "payment_method": None,
                "is_essential": True,
            })

    if not transaction_type or transaction_type == "investment":
        q = select(Investment).where(Investment.user_id == current_user.id)
        if start_date:
            q = q.where(Investment.purchase_date >= start_date)
        if end_date:
            q = q.where(Investment.purchase_date <= end_date)
        result = await db.execute(q)
        for inv in result.scalars().all():
            transactions.append({
                "id": inv.id,
                "type": "investment",
                "amount": inv.amount_invested,
                "title": inv.name,
                "category": inv.investment_type,
                "date": str(inv.purchase_date),
                "description": inv.notes,
                "is_recurring": False,
                "payment_method": None,
                "is_essential": True,
            })

    # Sort
    if sort == "newest":
        transactions.sort(key=lambda x: x["date"], reverse=True)
    elif sort == "oldest":
        transactions.sort(key=lambda x: x["date"])
    elif sort == "highest":
        transactions.sort(key=lambda x: x["amount"], reverse=True)
    elif sort == "lowest":
        transactions.sort(key=lambda x: x["amount"])

    total = len(transactions)
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": transactions[skip: skip + limit],
    }
