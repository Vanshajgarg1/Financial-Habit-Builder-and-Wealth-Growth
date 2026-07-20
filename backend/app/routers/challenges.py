from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.habits import Challenge, UserChallenge
from app.schemas.habits import (
    ChallengeCreate, ChallengeResponse, UserChallengeResponse, UpdateChallengeProgress
)
from app.services.gamification import award_challenge_completion

router = APIRouter(tags=["challenges"])


@router.get("/api/challenges", response_model=list[ChallengeResponse])
async def list_challenges(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Challenge).where(Challenge.is_predefined == True))
    return result.scalars().all()


@router.post("/api/challenges", response_model=ChallengeResponse, status_code=201)
async def create_custom_challenge(
    data: ChallengeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    challenge = Challenge(is_predefined=False, **data.model_dump())
    db.add(challenge)
    await db.commit()
    await db.refresh(challenge)
    return challenge


@router.post("/api/challenges/{challenge_id}/join", response_model=UserChallengeResponse, status_code=201)
async def join_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    challenge_result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    challenge = challenge_result.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Check if already joined
    existing = await db.execute(
        select(UserChallenge).where(
            and_(
                UserChallenge.user_id == current_user.id,
                UserChallenge.challenge_id == challenge_id,
                UserChallenge.status == "active",
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already joined this challenge")

    start = date.today()
    uc = UserChallenge(
        user_id=current_user.id,
        challenge_id=challenge_id,
        start_date=start,
        end_date=start + timedelta(days=challenge.duration_days),
        status="active",
    )
    db.add(uc)
    await db.commit()
    await db.refresh(uc)

    result = await _build_uc_response(uc, challenge)
    return result


@router.get("/api/user-challenges", response_model=list[UserChallengeResponse])
async def list_user_challenges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserChallenge).where(UserChallenge.user_id == current_user.id)
        .order_by(UserChallenge.created_at.desc())
    )
    ucs = result.scalars().all()
    responses = []
    for uc in ucs:
        ch_result = await db.execute(select(Challenge).where(Challenge.id == uc.challenge_id))
        challenge = ch_result.scalar_one_or_none()
        responses.append(await _build_uc_response(uc, challenge))
    return responses


@router.put("/api/user-challenges/{uc_id}/progress")
async def update_progress(
    uc_id: int,
    data: UpdateChallengeProgress,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserChallenge).where(
            and_(UserChallenge.id == uc_id, UserChallenge.user_id == current_user.id)
        )
    )
    uc = result.scalar_one_or_none()
    if not uc:
        raise HTTPException(status_code=404, detail="User challenge not found")

    ch_result = await db.execute(select(Challenge).where(Challenge.id == uc.challenge_id))
    challenge = ch_result.scalar_one_or_none()

    uc.current_progress = data.progress
    if uc.current_progress >= challenge.target_value:
        from datetime import datetime
        uc.status = "completed"
        uc.completed_at = datetime.utcnow()
        await award_challenge_completion(current_user, challenge, db)

    await db.commit()
    return {"message": "Progress updated", "status": uc.status}


@router.delete("/api/user-challenges/{uc_id}")
async def leave_challenge(
    uc_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserChallenge).where(
            and_(UserChallenge.id == uc_id, UserChallenge.user_id == current_user.id)
        )
    )
    uc = result.scalar_one_or_none()
    if not uc:
        raise HTTPException(status_code=404, detail="User challenge not found")
    uc.status = "abandoned"
    await db.commit()
    return {"message": "Challenge left"}


async def _build_uc_response(uc: UserChallenge, challenge: Challenge) -> UserChallengeResponse:
    today = date.today()
    days_remaining = max(0, (uc.end_date - today).days)
    progress_pct = (uc.current_progress / challenge.target_value * 100) if challenge.target_value > 0 else 0.0
    return UserChallengeResponse(
        id=uc.id,
        user_id=uc.user_id,
        challenge_id=uc.challenge_id,
        challenge=ChallengeResponse.model_validate(challenge),
        start_date=uc.start_date,
        end_date=uc.end_date,
        current_progress=uc.current_progress,
        status=uc.status,
        progress_percentage=min(100.0, progress_pct),
        days_remaining=days_remaining,
        completed_at=uc.completed_at,
        created_at=uc.created_at,
    )
