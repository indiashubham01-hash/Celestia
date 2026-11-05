#!/usr/bin/env python3
"""
Root runner proxy for backend/bot.py
"""
import sys
import os

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from backend.bot import main

if __name__ == "__main__":
    main()

