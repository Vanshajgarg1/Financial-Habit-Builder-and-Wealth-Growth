from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_tables
from app.routers import auth, income, expenses, goals, investments, habits, challenges, reminders, dashboard, transactions, reports, badges


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await create_tables()
        print("Database tables verified/created successfully.")
    except Exception as e:
        print(f"Database initialization error on startup: {e}")
    yield


app = FastAPI(
    title="FinGrow API",
    description="Financial Habit Builder & Wealth Growth Tracker",
    version="1.0.0",
    lifespan=lifespan,
)

# Explicit allowed origins
allowed_origins = [
    "https://financial-habit-builder-and-wealth.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if hasattr(settings, "FRONTEND_URL") and settings.FRONTEND_URL:
    clean_frontend_url = settings.FRONTEND_URL.rstrip("/")
    if clean_frontend_url not in allowed_origins:
        allowed_origins.append(clean_frontend_url)

# Add CORS Middleware with explicit HTTP methods including OPTIONS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://financial-habit-builder-and-wealth.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
