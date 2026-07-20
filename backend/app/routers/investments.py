from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.finance import Investment
from app.schemas.finance import InvestmentCreate, InvestmentUpdate, InvestmentResponse

router = APIRouter(prefix="/api/investments", tags=["investments"])


@router.get("", response_model=list[InvestmentResponse])
async def list_investments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Investment).where(Investment.user_id == current_user.id).order_by(Investment.purchase_date.desc())
    )
    investments = result.scalars().all()
    return [InvestmentResponse.from_orm_with_calc(inv) for inv in investments]


@router.post("", response_model=InvestmentResponse, status_code=201)
async def create_investment(
    data: InvestmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    investment = Investment(user_id=current_user.id, **data.model_dump())
    db.add(investment)
    await db.commit()
    await db.refresh(investment)
    return InvestmentResponse.from_orm_with_calc(investment)


@router.get("/{investment_id}", response_model=InvestmentResponse)
async def get_investment(
    investment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Investment).where(
            and_(Investment.id == investment_id, Investment.user_id == current_user.id)
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Investment not found")
    return InvestmentResponse.from_orm_with_calc(inv)


@router.put("/{investment_id}", response_model=InvestmentResponse)
async def update_investment(
    investment_id: int,
    data: InvestmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Investment).where(
            and_(Investment.id == investment_id, Investment.user_id == current_user.id)
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Investment not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(inv, field, value)
    await db.commit()
    await db.refresh(inv)
    return InvestmentResponse.from_orm_with_calc(inv)


@router.delete("/{investment_id}")
async def delete_investment(
    investment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Investment).where(
            and_(Investment.id == investment_id, Investment.user_id == current_user.id)
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Investment not found")
    await db.delete(inv)
    await db.commit()
    return {"message": "Investment deleted"}
