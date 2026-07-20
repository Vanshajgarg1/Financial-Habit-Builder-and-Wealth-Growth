"""
Seed script: creates demo user and 6 months of realistic data.
Run: cd backend && python -m app.seed
"""
import asyncio
from datetime import date, timedelta, time
import random

from app.core.database import create_tables, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.finance import Income, Expense, SavingsGoal, SavingsContribution, Investment
from app.models.habits import Habit, HabitCompletion, Challenge, UserChallenge, Reminder
from app.services.streak import compute_period_key

DEMO_EMAIL = "demo@fingrow.app"
DEMO_PASSWORD = "Demo@123"


async def seed():
    await create_tables()
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select

        # Check if demo user already exists
        result = await db.execute(select(User).where(User.email == DEMO_EMAIL))
        existing = result.scalar_one_or_none()
        if existing:
            print("Demo user already exists. Skipping seed.")
            return

        # Create demo user
        user = User(
            full_name="Arjun Sharma",
            email=DEMO_EMAIL,
            hashed_password=get_password_hash(DEMO_PASSWORD),
            preferred_currency="INR",
            monthly_income_target=60000,
            monthly_savings_target=12000,
            points=245,
        )
        db.add(user)
        await db.flush()
        user_id = user.id

        today = date.today()

        # ── 6 months of income ────────────────────────────────────────────────
        for i in range(6):
            month_date = today.replace(day=5) - timedelta(days=i * 30)
            db.add(Income(user_id=user_id, amount=55000, source="TechCorp Pvt Ltd", category="Salary",
                          date=month_date, description="Monthly salary", is_recurring=True))
            if i % 2 == 0:
                db.add(Income(user_id=user_id, amount=random.randint(8000, 20000),
                              source="Freelance Web Project", category="Freelancing",
                              date=month_date + timedelta(days=10), is_recurring=False))
            if i == 2:
                db.add(Income(user_id=user_id, amount=5000, source="Referral Bonus",
                              category="Other", date=month_date + timedelta(days=15)))

        # ── 6 months of expenses ──────────────────────────────────────────────
        categories = [
            ("Rent", "Bank Transfer", 18000, True),
            ("Food", "UPI", 4500, True),
            ("Transportation", "UPI", 1800, True),
            ("Shopping", "Credit Card", 3200, False),
            ("Entertainment", "UPI", 1500, False),
            ("Education", "Debit Card", 2000, True),
            ("Utilities", "Bank Transfer", 1200, True),
            ("Subscriptions", "Credit Card", 999, False),
        ]
        for i in range(6):
            base_date = today.replace(day=3) - timedelta(days=i * 30)
            for cat, pm, amt, essential in categories:
                jitter = random.randint(-500, 800)
                db.add(Expense(
                    user_id=user_id,
                    amount=max(100, amt + jitter),
                    title=f"{cat} Expense",
                    category=cat,
                    payment_method=pm,
                    date=base_date + timedelta(days=random.randint(0, 28)),
                    is_essential=essential,
                    is_recurring=(cat in ["Rent", "Utilities", "Subscriptions"]),
                ))
            # Extra food expenses
            for _ in range(random.randint(3, 6)):
                db.add(Expense(user_id=user_id, amount=random.randint(150, 600),
                               title="Lunch / Dinner", category="Food",
                               payment_method="UPI",
                               date=base_date + timedelta(days=random.randint(0, 28)),
                               is_essential=True))

        # ── Savings goals ─────────────────────────────────────────────────────
        laptop_goal = SavingsGoal(
            user_id=user_id, title="New Laptop", target_amount=80000,
            current_amount=32000, target_date=today + timedelta(days=120),
            category="Laptop", status="in_progress",
            description="MacBook Pro for development work",
        )
        emergency_goal = SavingsGoal(
            user_id=user_id, title="Emergency Fund", target_amount=150000,
            current_amount=55000, target_date=today + timedelta(days=365),
            category="Emergency fund", status="in_progress",
            description="6 months of expenses",
        )
        travel_goal = SavingsGoal(
            user_id=user_id, title="Goa Trip", target_amount=25000,
            current_amount=25000, target_date=today - timedelta(days=10),
            category="Travel", status="completed",
        )
        db.add_all([laptop_goal, emergency_goal, travel_goal])
        await db.flush()

        # Contributions
        for i in range(6):
            cdate = today.replace(day=15) - timedelta(days=i * 30)
            db.add(SavingsContribution(user_id=user_id, goal_id=laptop_goal.id,
                                       amount=6000, date=cdate, note="Monthly laptop savings"))
            db.add(SavingsContribution(user_id=user_id, goal_id=emergency_goal.id,
                                       amount=10000, date=cdate, note="Emergency fund contribution"))

        # ── Investments ───────────────────────────────────────────────────────
        db.add(Investment(user_id=user_id, name="Axis Bluechip Fund", investment_type="Mutual funds",
                          amount_invested=50000, current_value=58500,
                          purchase_date=today - timedelta(days=180), notes="SIP - monthly ₹5000"))
        db.add(Investment(user_id=user_id, name="SBI Fixed Deposit", investment_type="Fixed deposit",
                          amount_invested=100000, current_value=107500,
                          purchase_date=today - timedelta(days=365), notes="1 year FD at 7.5%"))
        db.add(Investment(user_id=user_id, name="Infosys Shares", investment_type="Stocks",
                          amount_invested=25000, current_value=28750,
                          purchase_date=today - timedelta(days=90), notes="50 shares"))
        db.add(Investment(user_id=user_id, name="Digital Gold", investment_type="Gold",
                          amount_invested=15000, current_value=16200,
                          purchase_date=today - timedelta(days=60)))

        # ── Habits ────────────────────────────────────────────────────────────
        habit1 = Habit(user_id=user_id, title="Record every expense", habit_type="expense_recording",
                       frequency="daily", start_date=today - timedelta(days=30),
                       is_active=True, current_streak=7, longest_streak=12,
                       total_completions=22, reminder_time=time(21, 0))
        habit2 = Habit(user_id=user_id, title="Save ₹500 daily", habit_type="saving",
                       target_amount=500, frequency="daily",
                       start_date=today - timedelta(days=20),
                       is_active=True, current_streak=5, longest_streak=8,
                       total_completions=14)
        habit3 = Habit(user_id=user_id, title="Weekly finance review", habit_type="financial_review",
                       frequency="weekly", start_date=today - timedelta(days=60),
                       is_active=True, current_streak=4, longest_streak=6,
                       total_completions=8, reminder_time=time(10, 0))
        db.add_all([habit1, habit2, habit3])
        await db.flush()

        # Habit completions for last 7 days
        for i in range(7):
            d = today - timedelta(days=i)
            pk = compute_period_key("daily", d)
            db.add(HabitCompletion(user_id=user_id, habit_id=habit1.id,
                                   completion_date=d, period_key=pk))

        # ── Predefined Challenges ─────────────────────────────────────────────
        ch1 = Challenge(title="Save ₹100 Daily for 7 Days", challenge_type="saving",
                        target_value=700, duration_days=7, reward_points=100, is_predefined=True,
                        description="Save at least ₹100 every day for 7 consecutive days")
        ch2 = Challenge(title="No Online Food Orders for 5 Days", challenge_type="spending_control",
                        target_value=5, duration_days=5, reward_points=75, is_predefined=True,
                        description="Avoid ordering food online for 5 days")
        ch3 = Challenge(title="Record Every Expense for 30 Days", challenge_type="expense_recording",
                        target_value=30, duration_days=30, reward_points=200, is_predefined=True,
                        description="Track every single expense for an entire month")
        ch4 = Challenge(title="Save 10% of Monthly Income", challenge_type="saving",
                        target_value=10, duration_days=30, reward_points=150, is_predefined=True,
                        description="Save at least 10% of your monthly income")
        ch5 = Challenge(title="No Unnecessary Shopping for 2 Weeks", challenge_type="spending_control",
                        target_value=14, duration_days=14, reward_points=100, is_predefined=True,
                        description="Avoid unnecessary shopping for 14 days")
        ch6 = Challenge(title="Invest a Fixed Amount This Month", challenge_type="investing",
                        target_value=5000, duration_days=30, reward_points=125, is_predefined=True,
                        description="Invest at least ₹5,000 this month in any instrument")
        db.add_all([ch1, ch2, ch3, ch4, ch5, ch6])
        await db.flush()

        # User enrolled in 2 challenges
        db.add(UserChallenge(user_id=user_id, challenge_id=ch1.id,
                             start_date=today - timedelta(days=3),
                             end_date=today + timedelta(days=4),
                             current_progress=300, status="active"))
        db.add(UserChallenge(user_id=user_id, challenge_id=ch3.id,
                             start_date=today - timedelta(days=10),
                             end_date=today + timedelta(days=20),
                             current_progress=10, status="active"))

        # ── Reminders ─────────────────────────────────────────────────────────
        db.add(Reminder(user_id=user_id, title="Record today's expenses",
                        reminder_type="expense_recording",
                        reminder_time=time(21, 0), frequency="daily", is_active=True))
        db.add(Reminder(user_id=user_id, title="Pay electricity bill",
                        reminder_type="bill_payment",
                        reminder_date=today + timedelta(days=5),
                        reminder_time=time(10, 0), frequency="once", is_active=True))
        db.add(Reminder(user_id=user_id, title="Laptop savings contribution",
                        reminder_type="goal_contribution",
                        reminder_date=today.replace(day=15) if today.day < 15 else (today + timedelta(days=30)).replace(day=15),
                        reminder_time=time(9, 0), frequency="monthly", is_active=True))
        db.add(Reminder(user_id=user_id, title="Weekly finance review",
                        reminder_type="financial_review",
                        reminder_time=time(10, 0), frequency="weekly", is_active=True))

        await db.commit()
        print(f"✅ Seed complete!")
        print(f"   Demo user: {DEMO_EMAIL}")
        print(f"   Password:  {DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
