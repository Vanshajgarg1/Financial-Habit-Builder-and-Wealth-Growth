from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_tables
from app.routers import auth, income, expenses, goals, investments, habits, challenges, reminders, dashboard, transactions, reports, badges


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (dev mode)
    await create_tables()
    yield


app = FastAPI(
    title="FinGrow API",
    description="Financial Habit Builder & Wealth Growth Tracker",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router)
app.include_router(income.router)
app.include_router(expenses.router)
app.include_router(goals.router)
app.include_router(investments.router)
app.include_router(habits.router)
app.include_router(challenges.router)
app.include_router(reminders.router)
app.include_router(dashboard.router)
app.include_router(transactions.router)
app.include_router(reports.router)
app.include_router(badges.router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": "FinGrow API"}
