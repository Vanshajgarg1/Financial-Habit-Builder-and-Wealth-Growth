from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.habits import Badge, UserBadge
from app.schemas.habits import BadgeResponse, UserBadgeResponse

router = APIRouter(prefix="/api/badges", tags=["badges"])


@router.get("", response_model=list[UserBadgeResponse])
async def get_my_badges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserBadge).where(UserBadge.user_id == current_user.id)
        .order_by(UserBadge.awarded_at.desc())
    )
    user_badges = result.scalars().all()
    responses = []
    for ub in user_badges:
        badge_result = await db.execute(select(Badge).where(Badge.id == ub.badge_id))
        badge = badge_result.scalar_one_or_none()
        if badge:
            responses.append(
                UserBadgeResponse(
                    id=ub.id,
                    badge=BadgeResponse.model_validate(badge),
                    awarded_at=ub.awarded_at,
                )
            )
    return responses
