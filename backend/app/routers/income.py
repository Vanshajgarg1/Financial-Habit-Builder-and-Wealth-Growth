from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.finance import Income
from app.schemas.finance import IncomeCreate, IncomeUpdate, IncomeResponse

router = APIRouter(prefix="/api/incomes", tags=["income"])


@router.get("", response_model=list[IncomeResponse])
async def list_incomes(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Income).where(Income.user_id == current_user.id)
    if start_date:
        query = query.where(Income.date >= start_date)
    if end_date:
        query = query.where(Income.date <= end_date)
    if category:
        query = query.where(Income.category == category)
    if search:
        query = query.where(Income.source.ilike(f"%{search}%"))
    query = query.order_by(Income.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=IncomeResponse, status_code=201)
async def create_income(
    data: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    income = Income(user_id=current_user.id, **data.model_dump())
    db.add(income)
    await db.commit()
    await db.refresh(income)
    # Check gamification
    from app.services.gamification import check_and_award_income_badges
    await check_and_award_income_badges(current_user.id, db)
    return income


@router.get("/{income_id}", response_model=IncomeResponse)
async def get_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Income).where(and_(Income.id == income_id, Income.user_id == current_user.id))
    )
    income = result.scalar_one_or_none()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    return income


@router.put("/{income_id}", response_model=IncomeResponse)
async def update_income(
    income_id: int,
    data: IncomeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Income).where(and_(Income.id == income_id, Income.user_id == current_user.id))
    )
    income = result.scalar_one_or_none()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(income, field, value)
    await db.commit()
    await db.refresh(income)
    return income


@router.delete("/{income_id}")
async def delete_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Income).where(and_(Income.id == income_id, Income.user_id == current_user.id))
    )
    income = result.scalar_one_or_none()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    await db.delete(income)
    await db.commit()
    return {"message": "Income deleted"}
