from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from datetime import date, time, datetime


# ── Habit ────────────────────────────────────────────────────────────────────

class HabitCreate(BaseModel):
    title: str
    description: Optional[str] = None
    habit_type: str
    target_amount: Optional[float] = None
    frequency: str  # daily, weekly, monthly
    start_date: date
    reminder_time: Optional[time] = None
    is_active: bool = True


class HabitUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    habit_type: Optional[str] = None
    target_amount: Optional[float] = None
    frequency: Optional[str] = None
    reminder_time: Optional[time] = None
    is_active: Optional[bool] = None


class HabitResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    habit_type: str
    target_amount: Optional[float]
    frequency: str
    start_date: date
    reminder_time: Optional[time]
    is_active: bool
    current_streak: int
    longest_streak: int
    total_completions: int
    completed_today: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class HabitCompletionResponse(BaseModel):
    id: int
    habit_id: int
    completion_date: date
    period_key: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Challenge ─────────────────────────────────────────────────────────────────

class ChallengeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    challenge_type: str
    target_value: float
    duration_days: int
    reward_points: int = 100


class ChallengeResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    challenge_type: str
    target_value: float
    duration_days: int
    reward_points: int
    is_predefined: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserChallengeResponse(BaseModel):
    id: int
    user_id: int
    challenge_id: int
    challenge: ChallengeResponse
    start_date: date
    end_date: date
    current_progress: float
    status: str
    progress_percentage: float = 0.0
    days_remaining: int = 0
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateChallengeProgress(BaseModel):
    progress: float

    @field_validator("progress")
    @classmethod
    def non_negative(cls, v):
        if v < 0:
            raise ValueError("Progress cannot be negative")
        return v


# ── Reminder ──────────────────────────────────────────────────────────────────

class ReminderCreate(BaseModel):
    title: str
    reminder_type: str
    reminder_date: Optional[date] = None
    reminder_time: Optional[time] = None
    frequency: str  # once, daily, weekly, monthly
    related_entity_id: Optional[int] = None
    is_active: bool = True


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    reminder_type: Optional[str] = None
    reminder_date: Optional[date] = None
    reminder_time: Optional[time] = None
    frequency: Optional[str] = None
    is_active: Optional[bool] = None


class ReminderResponse(BaseModel):
    id: int
    user_id: int
    title: str
    reminder_type: str
    reminder_date: Optional[date]
    reminder_time: Optional[time]
    frequency: str
    related_entity_id: Optional[int]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Badge ─────────────────────────────────────────────────────────────────────

class BadgeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    icon: str
    points_required: int
    trigger: str

    model_config = {"from_attributes": True}


class UserBadgeResponse(BaseModel):
    id: int
    badge: BadgeResponse
    awarded_at: datetime

    model_config = {"from_attributes": True}
