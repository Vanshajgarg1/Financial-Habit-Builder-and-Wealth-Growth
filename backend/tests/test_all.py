import pytest
from datetime import date


@pytest.mark.asyncio
async def test_auth_and_profile(client):
    # 1. Registration
    reg_data = {
        "full_name": "Test User",
        "email": "test@fingrow.app",
        "password": "Password123",
        "confirm_password": "Password123",
    }
    res = await client.post("/api/auth/register", json=reg_data)
    assert res.status_code == 201
    assert res.json()["email"] == "test@fingrow.app"

    # 2. Login
    login_data = {"email": "test@fingrow.app", "password": "Password123"}
    res = await client.post("/api/auth/login", json=login_data)
    assert res.status_code == 200
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Protected Route: Get Profile
    res = await client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["full_name"] == "Test User"


@pytest.mark.asyncio
async def test_income_crud_and_ownership(client):
    # Create two users
    u1 = await client.post(
        "/api/auth/register",
        json={
            "full_name": "User One",
            "email": "u1@fingrow.app",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    u2 = await client.post(
        "/api/auth/register",
        json={
            "full_name": "User Two",
            "email": "u2@fingrow.app",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )

    t1 = (await client.post("/api/auth/login", json={"email": "u1@fingrow.app", "password": "Password123"})).json()["access_token"]
    t2 = (await client.post("/api/auth/login", json={"email": "u2@fingrow.app", "password": "Password123"})).json()["access_token"]

    h1 = {"Authorization": f"Bearer {t1}"}
    h2 = {"Authorization": f"Bearer {t2}"}

    # Create income for user 1
    income_data = {
        "amount": 5000,
        "source": "Freelancing Job",
        "category": "Freelancing",
        "date": str(date.today()),
        "description": "Short web project",
        "is_recurring": False,
    }
    res = await client.post("/api/incomes", json=income_data, headers=h1)
    assert res.status_code == 201
    income_id = res.json()["id"]

    # Verify user 1 can view
    res = await client.get(f"/api/incomes/{income_id}", headers=h1)
    assert res.status_code == 200

    # Verify user 2 cannot view (Ownership restriction)
    res = await client.get(f"/api/incomes/{income_id}", headers=h2)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_expense_crud(client):
    # Register & Login
    await client.post(
        "/api/auth/register",
        json={
            "full_name": "Expense Tester",
            "email": "exp@fingrow.app",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    t = (await client.post("/api/auth/login", json={"email": "exp@fingrow.app", "password": "Password123"})).json()["access_token"]
    headers = {"Authorization": f"Bearer {t}"}

    expense_data = {
        "amount": 1200,
        "title": "Groceries Store",
        "category": "Food",
        "payment_method": "UPI",
        "date": str(date.today()),
        "description": "Weekly needs",
        "is_recurring": False,
        "is_essential": True,
    }
    res = await client.post("/api/expenses", json=expense_data, headers=headers)
    assert res.status_code == 201
    expense_id = res.json()["id"]

    # Get List
    res = await client.get("/api/expenses", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1


@pytest.mark.asyncio
async def test_goals_and_contributions(client):
    # Setup
    await client.post(
        "/api/auth/register",
        json={
            "full_name": "Goal Tester",
            "email": "goal@fingrow.app",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    t = (await client.post("/api/auth/login", json={"email": "goal@fingrow.app", "password": "Password123"})).json()["access_token"]
    headers = {"Authorization": f"Bearer {t}"}

    # Create Goal
    goal_data = {
        "title": "New iPhone",
        "target_amount": 100000,
        "category": "Laptop",
        "target_date": str(date.today()),
        "description": "Save for phone upgrade",
    }
    res = await client.post("/api/goals", json=goal_data, headers=headers)
    assert res.status_code == 201
    goal_id = res.json()["id"]
    assert res.json()["status"] == "not_started"

    # Add Contribution
    contrib_data = {
        "amount": 25000,
        "date": str(date.today()),
        "note": "Initial savings",
    }
    res = await client.post(f"/api/goals/{goal_id}/contributions", json=contrib_data, headers=headers)
    assert res.status_code == 201
    assert res.json()["amount"] == 25000

    # Get Goal details again to check updated current_amount & status
    res = await client.get(f"/api/goals/{goal_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["current_amount"] == 25000
    assert res.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_investment_calculations(client):
    # Setup
    await client.post(
        "/api/auth/register",
        json={
            "full_name": "Investor",
            "email": "invest@fingrow.app",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    t = (await client.post("/api/auth/login", json={"email": "invest@fingrow.app", "password": "Password123"})).json()["access_token"]
    headers = {"Authorization": f"Bearer {t}"}

    inv_data = {
        "name": "Nifty Index Fund",
        "investment_type": "Mutual funds",
        "amount_invested": 10000,
        "current_value": 12500,
        "purchase_date": str(date.today()),
        "notes": "100 units",
    }
    res = await client.post("/api/investments", json=inv_data, headers=headers)
    assert res.status_code == 201
    res_json = res.json()
    assert res_json["profit_loss"] == 2500
    assert res_json["return_percentage"] == 25.0


@pytest.mark.asyncio
async def test_habits_and_streaks(client):
    # Setup
    await client.post(
        "/api/auth/register",
        json={
            "full_name": "Habiter",
            "email": "habit@fingrow.app",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    t = (await client.post("/api/auth/login", json={"email": "habit@fingrow.app", "password": "Password123"})).json()["access_token"]
    headers = {"Authorization": f"Bearer {t}"}

    habit_data = {
        "title": "Track Expense Daily",
        "habit_type": "expense_recording",
        "frequency": "daily",
        "start_date": str(date.today()),
        "is_active": True,
    }
    res = await client.post("/api/habits", json=habit_data, headers=headers)
    assert res.status_code == 201
    habit_id = res.json()["id"]

    # Mark Complete
    res = await client.post(f"/api/habits/{habit_id}/complete", headers=headers)
    assert res.status_code == 200
    assert res.json()["current_streak"] == 1


@pytest.mark.asyncio
async def test_dashboard_summary(client):
    # Setup
    await client.post(
        "/api/auth/register",
        json={
            "full_name": "Dash",
            "email": "dash@fingrow.app",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    t = (await client.post("/api/auth/login", json={"email": "dash@fingrow.app", "password": "Password123"})).json()["access_token"]
    headers = {"Authorization": f"Bearer {t}"}

    # Add single income and single expense
    await client.post(
        "/api/incomes",
        json={
            "amount": 10000,
            "source": "Salary Pay",
            "category": "Salary",
            "date": str(date.today()),
            "is_recurring": True,
        },
        headers=headers,
    )
    await client.post(
        "/api/expenses",
        json={
            "amount": 4000,
            "title": "Monthly rent",
            "category": "Rent",
            "payment_method": "Bank Transfer",
            "date": str(date.today()),
            "is_recurring": True,
            "is_essential": True,
        },
        headers=headers,
    )

    # Get Dashboard
    res = await client.get("/api/dashboard/summary", headers=headers)
    assert res.status_code == 200
    res_json = res.json()
    assert res_json["total_income"] == 10000
    assert res_json["total_expenses"] == 4000
    assert res_json["balance"] == 6000
    assert res_json["savings_rate"] == 60.0
