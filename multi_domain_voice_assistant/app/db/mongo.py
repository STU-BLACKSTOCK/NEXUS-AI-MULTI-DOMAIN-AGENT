"""
MongoDB connection helper (pymongo).

Provides a singleton MongoClient and database handle.
"""

from __future__ import annotations

from pymongo import MongoClient
from pymongo.database import Database

from app.config import MONGODB_URI, MONGODB_DB_NAME

_client: MongoClient | None = None


def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGODB_URI)
    return _client


def get_db() -> Database:
    return get_mongo_client()[MONGODB_DB_NAME]

