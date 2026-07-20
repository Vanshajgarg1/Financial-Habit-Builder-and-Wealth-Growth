from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.habits import Habit, HabitCompletion
from app.schemas.habits import HabitCreate, HabitUpdate, HabitResponse, HabitCompletionResponse
from app.services.streak import compute_period_key, recalculate_streak
from app.services.gamification import check_and_award_habit_badges

router = APIRouter(prefix="/api/habits", tags=["habits"])


@router.get("", response_model=list[HabitResponse])
async def list_habits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Habit).where(Habit.user_id == current_user.id).order_by(Habit.created_at.desc())
    )
    habits = result.scalars().all()
    today = date.today()
    habit_list = []
    for habit in habits:
        period_key = compute_period_key(habit.frequency, today)
        completion_result = await db.execute(
            select(HabitCompletion).where(
                and_(
                    HabitCompletion.habit_id == habit.id,
                    HabitCompletion.period_key == period_key,
                )
            )
        )
        completed_today = completion_result.scalar_one_or_none() is not None
        h = HabitResponse.model_validate(habit)
        h.completed_today = completed_today
        habit_list.append(h)
    return habit_list


@router.post("", response_model=HabitResponse, status_code=201)
async def create_habit(
    data: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    habit = Habit(user_id=current_user.id, **data.model_dump())
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    h = HabitResponse.model_validate(habit)
    h.completed_today = False
    return h


@router.get("/{habit_id}", response_model=HabitResponse)
async def get_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Habit).where(and_(Habit.id == habit_id, Habit.user_id == current_user.id))
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit


@router.put("/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: int,
    data: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Habit).where(and_(Habit.id == habit_id, Habit.user_id == current_user.id))
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(habit, field, value)
    await db.commit()
    await db.refresh(habit)
    return habit


@router.delete("/{habit_id}")
async def delete_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Habit).where(and_(Habit.id == habit_id, Habit.user_id == current_user.id))
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    await db.delete(habit)
    await db.commit()
    return {"message": "Habit deleted"}


@router.post("/{habit_id}/complete")
async def complete_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Habit).where(and_(Habit.id == habit_id, Habit.user_id == current_user.id))
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    today = date.today()
    period_key = compute_period_key(habit.frequency, today)

    # Check if already completed for this period
    existing = await db.execute(
        select(HabitCompletion).where(
            and_(HabitCompletion.habit_id == habit_id, HabitCompletion.period_key == period_key)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Habit already completed for this period")

    completion = HabitCompletion(
        user_id=current_user.id,
        habit_id=habit_id,
        completion_date=today,
        period_key=period_key,
    )
    db.add(completion)
    await db.flush()
    habit.total_completions = (habit.total_completions or 0) + 1

    # Recalculate streak
    await recalculate_streak(habit, db)
    await db.commit()

    # Award points and check badges
    await check_and_award_habit_badges(current_user, habit, db)

    return {"message": "Habit completed", "current_streak": habit.current_streak}


@router.delete("/{habit_id}/complete")
async def undo_completion(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Habit).where(and_(Habit.id == habit_id, Habit.user_id == current_user.id))
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    today = date.today()
    period_key = compute_period_key(habit.frequency, today)

    existing = await db.execute(
        select(HabitCompletion).where(
            and_(HabitCompletion.habit_id == habit_id, HabitCompletion.period_key == period_key)
        )
    )
    completion = existing.scalar_one_or_none()
    if not completion:
        raise HTTPException(status_code=400, detail="No completion found for today")

    await db.delete(completion)
    await db.flush()
    habit.total_completions = max(0, (habit.total_completions or 1) - 1)
    await recalculate_streak(habit, db)
    await db.commit()


    return {"message": "Completion undone"}


@router.get("/{habit_id}/history", response_model=list[HabitCompletionResponse])
async def habit_history(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Habit).where(and_(Habit.id == habit_id, Habit.user_id == current_user.id))
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Habit not found")

    result = await db.execute(
        select(HabitCompletion)
        .where(HabitCompletion.habit_id == habit_id)
        .order_by(HabitCompletion.completion_date.desc())
    )
    return result.scalars().all()
