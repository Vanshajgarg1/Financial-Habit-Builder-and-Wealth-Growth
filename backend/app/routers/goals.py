from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.finance import SavingsGoal, SavingsContribution
from app.schemas.finance import (
    GoalCreate, GoalUpdate, GoalResponse,
    ContributionCreate, ContributionResponse,
)
from app.services.gamification import check_and_award_goal_badges

router = APIRouter(prefix="/api/goals", tags=["goals"])


def compute_status(goal: SavingsGoal) -> str:
    if goal.current_amount >= goal.target_amount:
        return "completed"
    if goal.current_amount == 0:
        return "not_started"
    if goal.target_date and date.today() > goal.target_date and goal.current_amount < goal.target_amount:
        return "overdue"
    return "in_progress"


@router.get("", response_model=list[GoalResponse])
async def list_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavingsGoal).where(SavingsGoal.user_id == current_user.id).order_by(SavingsGoal.created_at.desc())
    )
    goals = result.scalars().all()
    # Update statuses
    for goal in goals:
        goal.status = compute_status(goal)
    await db.commit()
    return goals


@router.post("", response_model=GoalResponse, status_code=201)
async def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    goal = SavingsGoal(user_id=current_user.id, **data.model_dump())
    goal.status = compute_status(goal)
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavingsGoal).where(and_(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id))
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavingsGoal).where(and_(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id))
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(goal, field, value)
    goal.status = compute_status(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavingsGoal).where(and_(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id))
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await db.delete(goal)
    await db.commit()
    return {"message": "Goal deleted"}


# ── Contributions ─────────────────────────────────────────────────────────────

@router.get("/{goal_id}/contributions", response_model=list[ContributionResponse])
async def list_contributions(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify goal ownership
    goal_result = await db.execute(
        select(SavingsGoal).where(and_(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id))
    )
    if not goal_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Goal not found")

    result = await db.execute(
        select(SavingsContribution)
        .where(SavingsContribution.goal_id == goal_id)
        .order_by(SavingsContribution.date.desc())
    )
    return result.scalars().all()


@router.post("/{goal_id}/contributions", response_model=ContributionResponse, status_code=201)
async def add_contribution(
    goal_id: int,
    data: ContributionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    goal_result = await db.execute(
        select(SavingsGoal).where(and_(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id))
    )
    goal = goal_result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    contribution = SavingsContribution(
        user_id=current_user.id,
        goal_id=goal_id,
        **data.model_dump(),
    )
    db.add(contribution)

    # Update goal current_amount
    goal.current_amount = (goal.current_amount or 0) + data.amount
    goal.status = compute_status(goal)

    await db.commit()
    await db.refresh(contribution)

    # Check badges
    await check_and_award_goal_badges(current_user.id, goal, db)

    return contribution
