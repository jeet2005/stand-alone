"""
Scoring Service - Calculates fantasy points for stock portfolios
Based on real market performance with Dream11-style multipliers
"""

from typing import Dict, List
from services.stocks import get_stock_details, get_nse_most_active


def calculate_stock_score(stock_data: Dict, entry_price: float = None) -> Dict:
    """
    Calculate score for a single stock
    
    Formula:
    base_score = price_change_% × 10
    volume_bonus = 10 (if high volume) else 0
    sector_bonus = 5 (if sector is performing) else 0
    loss_penalty = -5 (if change < -2%) else 0
    
    Returns: {score, breakdown}
    """
    breakdown = {
        "base_score": 0,
        "volume_bonus": 0,
        "sector_bonus": 0,
        "loss_penalty": 0,
        "total": 0
    }
    
    try:
        # Get price change percentage
        change_percent = 0
        if isinstance(stock_data, dict):
            # Try different field names for change
            change_percent = (
                stock_data.get("change_percent") or 
                stock_data.get("changePercent") or 
                stock_data.get("percent_change") or 
                stock_data.get("pChange") or
                0
            )
            
            # If it's a string, parse it
            if isinstance(change_percent, str):
                change_percent = float(change_percent.replace("%", "").replace("+", "").strip())
        
        # Base score: change % × 10
        base_score = change_percent * 10
        breakdown["base_score"] = round(base_score, 2)
        
        # Volume bonus
        volume = stock_data.get("volume") or stock_data.get("tradedVolume") or 0
        avg_volume = stock_data.get("avgVolume") or stock_data.get("averageVolume") or 0
        
        # High volume if current volume > 1.5x average
        if volume and avg_volume and float(volume) > float(avg_volume) * 1.5:
            breakdown["volume_bonus"] = 10
        elif volume and float(str(volume).replace(",", "")) > 1000000:  # 1M+ trades
            breakdown["volume_bonus"] = 5
        
        # Sector bonus (simplified - could check sector performance)
        sector = stock_data.get("sector") or stock_data.get("industry") or ""
        if sector.lower() in ["technology", "it", "banking", "financial services"]:
            breakdown["sector_bonus"] = 5
        elif sector.lower() in ["healthcare", "pharma", "fmcg"]:
            breakdown["sector_bonus"] = 3
        
        # Loss penalty for big drops
        if change_percent < -2:
            breakdown["loss_penalty"] = -5
        elif change_percent < -4:
            breakdown["loss_penalty"] = -10
        
        # Calculate total
        breakdown["total"] = (
            breakdown["base_score"] + 
            breakdown["volume_bonus"] + 
            breakdown["sector_bonus"] + 
            breakdown["loss_penalty"]
        )
        
    except Exception as e:
        breakdown["error"] = str(e)
    
    return breakdown


def calculate_portfolio_score(stocks: List[Dict], captain_symbol: str, 
                               vice_captain_symbol: str) -> Dict:
    """
    Calculate total score for a fantasy portfolio
    
    stocks: List of stocks with their data
    captain_symbol: Gets 2x multiplier
    vice_captain_symbol: Gets 1.5x multiplier
    """
    results = {
        "total_score": 0,
        "stocks": [],
        "captain_contribution": 0,
        "vice_captain_contribution": 0,
        "best_performer": None,
        "worst_performer": None
    }
    
    best_score = float("-inf")
    worst_score = float("inf")
    
    for stock in stocks:
        symbol = stock.get("symbol", "")
        name = stock.get("name", symbol)
        
        # Get current stock data
        stock_result = get_stock_details(name)
        current_data = {}
        
        if stock_result.get("success") and stock_result.get("data"):
            current_data = stock_result["data"]
        
        # Calculate base score
        score_breakdown = calculate_stock_score(current_data)
        base_score = score_breakdown["total"]
        
        # Apply multipliers
        multiplier = 1.0
        role = "regular"
        
        if symbol == captain_symbol:
            multiplier = 2.0
            role = "captain"
        elif symbol == vice_captain_symbol:
            multiplier = 1.5
            role = "vice_captain"
        
        final_score = base_score * multiplier
        
        stock_result = {
            "symbol": symbol,
            "name": name,
            "role": role,
            "multiplier": multiplier,
            "breakdown": score_breakdown,
            "base_score": base_score,
            "final_score": round(final_score, 2),
            "current_price": current_data.get("currentPrice") or current_data.get("current_price") or 0,
            "change_percent": current_data.get("pChange") or current_data.get("change_percent") or 0
        }
        
        results["stocks"].append(stock_result)
        results["total_score"] += final_score
        
        # Track captain/vc contribution
        if role == "captain":
            results["captain_contribution"] = final_score
        elif role == "vice_captain":
            results["vice_captain_contribution"] = final_score
        
        # Track best/worst
        if final_score > best_score:
            best_score = final_score
            results["best_performer"] = stock_result
        if final_score < worst_score:
            worst_score = final_score
            results["worst_performer"] = stock_result
    
    results["total_score"] = round(results["total_score"], 2)
    
    return results


def get_scoring_rules():
    """Return scoring rules for display"""
    return {
        "rules": [
            {
                "name": "Price Change Score",
                "description": "Every 1% price change = 10 points",
                "example": "+2.5% = 25 points"
            },
            {
                "name": "Volume Bonus",
                "description": "High trading volume adds bonus points",
                "example": "High volume = +10 points"
            },
            {
                "name": "Sector Bonus",
                "description": "Strong sectors give additional points",
                "example": "IT/Banking = +5 points"
            },
            {
                "name": "Captain Multiplier",
                "description": "Captain's score is doubled",
                "example": "Captain gets 2x points"
            },
            {
                "name": "Vice Captain Multiplier", 
                "description": "Vice Captain's score is multiplied by 1.5x",
                "example": "Vice Captain gets 1.5x points"
            },
            {
                "name": "Loss Penalty",
                "description": "Big losses incur penalties",
                "example": "-2% drop = -5 points"
            }
        ],
        "example_calculation": {
            "stock": "TCS",
            "price_change": "+2.5%",
            "base_score": 25,
            "volume_bonus": 10,
            "sector_bonus": 5,
            "role": "Captain (2x)",
            "final_score": 80
        }
    }


def rank_portfolio(score: float) -> Dict:
    """Determine rank/tier based on score"""
    if score >= 200:
        return {"tier": "Legendary", "badge": "🏆", "color": "#FFD700"}
    elif score >= 150:
        return {"tier": "Diamond", "badge": "💎", "color": "#B9F2FF"}
    elif score >= 100:
        return {"tier": "Gold", "badge": "🥇", "color": "#FFD700"}
    elif score >= 50:
        return {"tier": "Silver", "badge": "🥈", "color": "#C0C0C0"}
    elif score >= 0:
        return {"tier": "Bronze", "badge": "🥉", "color": "#CD7F32"}
    else:
        return {"tier": "Beginner", "badge": "📚", "color": "#808080"}
