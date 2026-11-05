"""
Bachega FastAPI Application Module Proxy
Exports the central FastAPI application from main.py
"""

import sys
import os

# Ensure root workspace is in sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from main import app  # noqa: E402, F401

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

