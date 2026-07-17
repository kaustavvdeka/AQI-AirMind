"""
Entry point matching the spec's `python ai/main.py`. Thin wrapper around
the actual FastAPI app in app/main.py so imports resolve cleanly either
way (`uvicorn app.main:app` from inside /ai, or `python ai/main.py` from
the project root).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

if __name__ == "__main__":
    from app.main import app  # noqa: F401
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
