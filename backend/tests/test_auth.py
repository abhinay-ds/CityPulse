import pytest
from tests.conftest import client
from app.database import SessionLocal
from app.models.user import User

def test_register_success():
    response = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123",
        "confirm_password": "password123"
    })
    assert response.status_code == 201
    assert "access_token" in response.json()

def test_register_duplicate():
    client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "dup@example.com",
        "password": "password123",
        "confirm_password": "password123"
    })
    response = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "dup@example.com",
        "password": "password123",
        "confirm_password": "password123"
    })
    assert response.status_code == 400
    assert response.json()["error"] == "Email already registered"

def test_register_weak_password():
    response = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "weak@example.com",
        "password": "short",
        "confirm_password": "short"
    })
    assert response.status_code == 422

def test_register_password_mismatch():
    response = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "mismatch@example.com",
        "password": "password123",
        "confirm_password": "password456"
    })
    assert response.status_code == 422

def test_login_success():
    client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "login@example.com",
        "password": "password123",
        "confirm_password": "password123"
    })
    response = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid():
    response = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_get_me():
    reg = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "me@example.com",
        "password": "password123",
        "confirm_password": "password123"
    })
    token = reg.json()["access_token"]
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"

def test_get_me_unauthorized():
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_logout():
    response = client.post("/api/auth/logout")
    assert response.status_code == 200

def test_password_hashed():
    client.post("/api/auth/register", json={
        "name": "Hash User",
        "email": "hash@example.com",
        "password": "password123",
        "confirm_password": "password123"
    })
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "hash@example.com").first()
        assert user is not None
        assert user.hashed_password != "password123"
        assert "$" in user.hashed_password
    finally:
        db.close()
