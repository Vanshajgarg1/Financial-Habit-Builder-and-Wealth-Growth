from sqlalchemy import Column, Integer, String, Float, Date, Boolean, DateTime, ForeignKey, Text, Time, func
from app.core.database import Base


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    habit_type = Column(String(100), nullable=False)  # saving, spending_control, expense_recording, investing, financial_review, custom
    target_amount = Column(Float, nullable=True)
    frequency = Column(String(20), nullable=False)  # daily, weekly, monthly
    start_date = Column(Date, nullable=False)
    reminder_time = Column(Time, nullable=True)
    is_active = Column(Boolean, default=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    total_completions = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class HabitCompletion(Base):
    __tablename__ = "habit_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    completion_date = Column(Date, nullable=False)
    period_key = Column(String(50), nullable=False)  # e.g. "2024-01-15" for daily, "2024-W03" for weekly
    created_at = Column(DateTime, server_default=func.now())


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    challenge_type = Column(String(100), nullable=False)
    target_value = Column(Float, nullable=False)
    duration_days = Column(Integer, nullable=False)
    reward_points = Column(Integer, default=100)
    is_predefined = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class UserChallenge(Base):
    __tablename__ = "user_challenges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    current_progress = Column(Float, default=0.0)
    status = Column(String(50), default="active")  # active, completed, abandoned
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    reminder_type = Column(String(100), nullable=False)
    reminder_date = Column(Date, nullable=True)
    reminder_time = Column(Time, nullable=True)
    frequency = Column(String(20), nullable=False)  # once, daily, weekly, monthly
    related_entity_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=False)
    points_required = Column(Integer, default=0)
    trigger = Column(String(100), nullable=False)  # first_expense, seven_day_streak, etc.
    created_at = Column(DateTime, server_default=func.now())


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id = Column(Integer, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)
    awarded_at = Column(DateTime, server_default=func.now())
