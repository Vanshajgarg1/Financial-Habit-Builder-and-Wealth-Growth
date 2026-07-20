from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime


# ── Income ──────────────────────────────────────────────────────────────────

class IncomeCreate(BaseModel):
    amount: float
    source: str
    category: str
    date: date
    description: Optional[str] = None
    is_recurring: bool = False

    @field_validator("amount")
    @classmethod
    def positive_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        return v


class IncomeUpdate(BaseModel):
    amount: Optional[float] = None
    source: Optional[str] = None
    category: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None
    is_recurring: Optional[bool] = None


class IncomeResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    source: str
    category: str
    date: date
    description: Optional[str]
    is_recurring: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Expense ─────────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    amount: float
    title: str
    category: str
    payment_method: str
    date: date
    description: Optional[str] = None
    is_recurring: bool = False
    is_essential: bool = True

    @field_validator("amount")
    @classmethod
    def positive_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        return v


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    title: Optional[str] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None
    is_recurring: Optional[bool] = None
    is_essential: Optional[bool] = None


class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    title: str
    category: str
    payment_method: str
    date: date
    description: Optional[str]
    is_recurring: bool
    is_essential: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── SavingsGoal ─────────────────────────────────────────────────────────────

class GoalCreate(BaseModel):
    title: str
    target_amount: float
    current_amount: float = 0.0
    target_date: Optional[date] = None
    category: str
    description: Optional[str] = None

    @field_validator("target_amount")
    @classmethod
    def positive_target(cls, v):
        if v <= 0:
            raise ValueError("Target amount must be greater than zero")
        return v


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = None
    target_date: Optional[date] = None
    category: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class GoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    target_amount: float
    current_amount: float
    target_date: Optional[date]
    category: str
    description: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ContributionCreate(BaseModel):
    amount: float
    date: date
    note: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def positive_amount(cls, v):
        if v <= 0:
            raise ValueError("Contribution must be greater than zero")
        return v


class ContributionResponse(BaseModel):
    id: int
    user_id: int
    goal_id: int
    amount: float
    date: date
    note: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Investment ───────────────────────────────────────────────────────────────

class InvestmentCreate(BaseModel):
    name: str
    investment_type: str
    amount_invested: float
    current_value: float
    purchase_date: date
    notes: Optional[str] = None

    @field_validator("amount_invested", "current_value")
    @classmethod
    def non_negative(cls, v):
        if v < 0:
            raise ValueError("Value cannot be negative")
        return v


class InvestmentUpdate(BaseModel):
    name: Optional[str] = None
    investment_type: Optional[str] = None
    amount_invested: Optional[float] = None
    current_value: Optional[float] = None
    purchase_date: Optional[date] = None
    notes: Optional[str] = None


class InvestmentResponse(BaseModel):
    id: int
    user_id: int
    name: str
    investment_type: str
    amount_invested: float
    current_value: float
    purchase_date: date
    notes: Optional[str]
    profit_loss: float
    return_percentage: float
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_calc(cls, obj):
        profit_loss = obj.current_value - obj.amount_invested
        return_pct = (profit_loss / obj.amount_invested * 100) if obj.amount_invested > 0 else 0.0
        return cls(
            id=obj.id,
            user_id=obj.user_id,
            name=obj.name,
            investment_type=obj.investment_type,
            amount_invested=obj.amount_invested,
            current_value=obj.current_value,
            purchase_date=obj.purchase_date,
            notes=obj.notes,
            profit_loss=profit_loss,
            return_percentage=return_pct,
            created_at=obj.created_at,
        )
