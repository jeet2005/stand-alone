"""
Contest Service - Manages fantasy stock contests
Daily and Weekly contests with Dream11-style gameplay
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# In-memory storage (replace with database in production)
_contests = {}
_user_entries = {}
_contest_results = {}


def generate_contest_id():
    """Generate unique contest ID"""
    return f"CTX-{uuid.uuid4().hex[:8].upper()}"


def create_daily_contest():
    """Create a daily contest"""
    contest_id = generate_contest_id()
    now = datetime.now()
    
    # Contest ends at 3:30 PM IST (market close)
    end_time = now.replace(hour=15, minute=30, second=0, microsecond=0)
    if now.hour >= 15 and now.minute >= 30:
        end_time += timedelta(days=1)
    
    contest = {
        "id": contest_id,
        "type": "daily",
        "name": f"Daily Challenge - {end_time.strftime('%d %b %Y')}",
        "description": "Build your dream portfolio and compete for the top spot!",
        "start_time": now.isoformat(),
        "end_time": end_time.isoformat(),
        "status": "active",
        "budget": 1000000,  # ₹10 Lakhs
        "min_stocks": 5,
        "max_stocks": 10,
        "entry_fee": 0,  # Free to play
        "prize_pool": "Educational Points",
        "participants": 0,
        "rules": {
            "captain_multiplier": 2.0,
            "vice_captain_multiplier": 1.5,
            "max_per_sector": 3
        }
    }
    
    _contests[contest_id] = contest
    return {"success": True, "contest": contest}


def create_weekly_contest():
    """Create a weekly contest"""
    contest_id = generate_contest_id()
    now = datetime.now()
    
    # Contest ends on Friday at 3:30 PM
    days_until_friday = (4 - now.weekday()) % 7
    if days_until_friday == 0 and now.hour >= 15:
        days_until_friday = 7
    
    end_time = now + timedelta(days=days_until_friday)
    end_time = end_time.replace(hour=15, minute=30, second=0, microsecond=0)
    
    contest = {
        "id": contest_id,
        "type": "weekly",
        "name": f"Weekly Championship - Week {end_time.strftime('%W, %Y')}",
        "description": "A week-long battle of stock picking skills!",
        "start_time": now.isoformat(),
        "end_time": end_time.isoformat(),
        "status": "active",
        "budget": 1000000,
        "min_stocks": 5,
        "max_stocks": 10,
        "entry_fee": 0,
        "prize_pool": "Educational Points + Badge",
        "participants": 0,
        "rules": {
            "captain_multiplier": 2.0,
            "vice_captain_multiplier": 1.5,
            "max_per_sector": 4
        }
    }
    
    _contests[contest_id] = contest
    return {"success": True, "contest": contest}


def get_active_contests():
    """Get all active contests"""
    now = datetime.now()
    active = []
    
    for contest in _contests.values():
        end_time = datetime.fromisoformat(contest["end_time"])
        if end_time > now and contest["status"] == "active":
            active.append(contest)
    
    # If no active contests, create default ones
    if not active:
        daily = create_daily_contest()
        weekly = create_weekly_contest()
        active = [daily["contest"], weekly["contest"]]
    
    return {"success": True, "contests": active}


def get_contest_by_id(contest_id):
    """Get a specific contest by ID"""
    if contest_id in _contests:
        return {"success": True, "contest": _contests[contest_id]}
    return {"success": False, "error": "Contest not found"}


def submit_portfolio(contest_id: str, user_id: str, stocks: List[Dict], 
                     captain_symbol: str, vice_captain_symbol: str):
    """
    Submit a portfolio for a contest
    
    stocks format: [{"symbol": "TCS", "name": "Tata Consultancy", "price": 3500, "quantity": 1}, ...]
    """
    # Validate contest
    if contest_id not in _contests:
        return {"success": False, "error": "Contest not found"}
    
    contest = _contests[contest_id]
    
    # Check contest is still active
    if datetime.fromisoformat(contest["end_time"]) < datetime.now():
        return {"success": False, "error": "Contest has ended"}
    
    # Validate stock count
    if len(stocks) < contest["min_stocks"] or len(stocks) > contest["max_stocks"]:
        return {
            "success": False, 
            "error": f"Select between {contest['min_stocks']} and {contest['max_stocks']} stocks"
        }
    
    # Validate budget
    total_invested = sum(s.get("price", 0) * s.get("quantity", 1) for s in stocks)
    if total_invested > contest["budget"]:
        return {"success": False, "error": "Budget exceeded"}
    
    # Validate captain/vice-captain
    symbols = [s["symbol"] for s in stocks]
    if captain_symbol not in symbols:
        return {"success": False, "error": "Captain must be in your team"}
    if vice_captain_symbol not in symbols:
        return {"success": False, "error": "Vice Captain must be in your team"}
    if captain_symbol == vice_captain_symbol:
        return {"success": False, "error": "Captain and Vice Captain must be different"}
    
    # Store entry
    entry_key = f"{contest_id}:{user_id}"
    entry = {
        "contest_id": contest_id,
        "user_id": user_id,
        "stocks": stocks,
        "captain": captain_symbol,
        "vice_captain": vice_captain_symbol,
        "total_invested": total_invested,
        "submitted_at": datetime.now().isoformat(),
        "status": "active",
        "score": 0
    }
    
    _user_entries[entry_key] = entry
    _contests[contest_id]["participants"] += 1
    
    return {"success": True, "entry": entry, "message": "Portfolio submitted successfully!"}


def get_user_entries(user_id: str):
    """Get all contest entries for a user"""
    entries = []
    for key, entry in _user_entries.items():
        if entry["user_id"] == user_id:
            # Add contest details
            if entry["contest_id"] in _contests:
                entry["contest"] = _contests[entry["contest_id"]]
            entries.append(entry)
    
    return {"success": True, "entries": entries}


def get_contest_leaderboard(contest_id: str, limit: int = 20):
    """Get leaderboard for a contest"""
    if contest_id not in _contests:
        return {"success": False, "error": "Contest not found"}
    
    # Get all entries for this contest
    entries = []
    for key, entry in _user_entries.items():
        if entry["contest_id"] == contest_id:
            entries.append({
                "user_id": entry["user_id"],
                "score": entry.get("score", 0),
                "stocks_count": len(entry["stocks"]),
                "captain": entry["captain"],
                "submitted_at": entry["submitted_at"]
            })
    
    # Sort by score descending
    entries.sort(key=lambda x: x["score"], reverse=True)
    
    # Add rank
    for i, entry in enumerate(entries[:limit]):
        entry["rank"] = i + 1
    
    return {
        "success": True, 
        "contest": _contests[contest_id],
        "leaderboard": entries[:limit]
    }


def update_entry_score(contest_id: str, user_id: str, score: float):
    """Update the score for a user's entry"""
    entry_key = f"{contest_id}:{user_id}"
    if entry_key in _user_entries:
        _user_entries[entry_key]["score"] = score
        return {"success": True}
    return {"success": False, "error": "Entry not found"}
