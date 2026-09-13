"""
Entry point to run the Multi-Domain Voice Assistant API server.
"""
import uvicorn

# Load .env before importing app config (which uses os.getenv)
from dotenv import load_dotenv

load_dotenv()

from app.config import API_HOST, API_PORT

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=API_HOST,
        port=API_PORT,
        reload=True,
    )
