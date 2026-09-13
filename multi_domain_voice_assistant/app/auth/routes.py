"""
Auth routes: register, login, profile.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Header
from pymongo.collection import Collection

from app.auth.models import RegisterRequest, LoginRequest, AuthResponse, UserProfile
from app.auth.security import hash_password, verify_password, create_access_token, decode_token
from app.db.mongo import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


def users_collection() -> Collection:
    db = get_db()
    col = db["users"]
    # ensure unique index for email (idempotent)
    col.create_index("email", unique=True)
    return col


@router.post("/register", response_model=UserProfile)
def register(req: RegisterRequest) -> UserProfile:
    col = users_collection()
    doc = {
        "name": req.name,
        "age": req.age,
        "education": req.education,
        "email": str(req.email).lower(),
        "password_hash": hash_password(req.password),
    }
    try:
        result = col.insert_one(doc)
    except Exception:
        raise HTTPException(status_code=409, detail="Email already registered")

    return UserProfile(
        user_id=str(result.inserted_id),
        name=req.name,
        age=req.age,
        education=req.education,
        email=req.email,
    )



@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest) -> AuthResponse:
    col = users_collection()
    user = col.find_one({"email": str(req.email).lower()})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(subject=str(user["_id"]))
    return AuthResponse(access_token=token)


def get_current_user_profile(authorization: str | None = Header(default=None)) -> UserProfile | None:
    """
    Optional auth dependency.
    If Authorization header missing, returns None (anonymous).
    If present and valid, returns UserProfile.
    """
    if not authorization:
        return None
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    col = users_collection()
    from bson import ObjectId

    user = col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return UserProfile(
        user_id=user_id,
        name=user.get("name", ""),
        age=int(user.get("age", 0)),
        education=user.get("education", ""),
        email=user.get("email", ""),
    )



def require_current_user_profile(authorization: str | None = Header(default=None)) -> UserProfile:
    """Strict auth dependency for protected endpoints."""
    profile = get_current_user_profile(authorization)
    if not profile:
        raise HTTPException(status_code=401, detail="Login required. Please register or login first.")
    return profile


@router.get("/me", response_model=UserProfile)
def me(profile: UserProfile | None = Depends(get_current_user_profile)) -> UserProfile:
    if not profile:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return profile

