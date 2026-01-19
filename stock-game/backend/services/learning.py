"""
AI Learning Service - Provides intelligent insights and learning tips
Analyzes portfolio performance and market trends
"""

from typing import Dict, List
from services.stocks import get_market_news, get_trending_stocks


def analyze_performance(portfolio_results: Dict) -> Dict:
    """
    Analyze why a user won or lost their contest
    Provides educational insights based on performance
    """
    insights = {
        "summary": "",
        "key_factors": [],
        "what_went_well": [],
        "areas_to_improve": [],
        "market_context": "",
        "learning_tip": ""
    }
    
    total_score = portfolio_results.get("total_score", 0)
    stocks = portfolio_results.get("stocks", [])
    best = portfolio_results.get("best_performer", {})
    worst = portfolio_results.get("worst_performer", {})
    
    # Determine overall performance
    if total_score >= 100:
        insights["summary"] = "🎉 Excellent Performance! Your stock selection was outstanding!"
    elif total_score >= 50:
        insights["summary"] = "👍 Good job! You made some solid picks today."
    elif total_score >= 0:
        insights["summary"] = "📊 Average performance. Room for improvement!"
    else:
        insights["summary"] = "📉 Tough day! Let's learn from this experience."
    
    # Analyze key factors
    if best:
        insights["key_factors"].append({
            "type": "positive",
            "title": f"Star Performer: {best.get('name', 'Unknown')}",
            "detail": f"Contributed {best.get('final_score', 0)} points" + 
                     (f" with {best.get('multiplier', 1)}x multiplier" if best.get('multiplier', 1) > 1 else "")
        })
        insights["what_went_well"].append(
            f"Your {best.get('role', 'pick')} {best.get('name')} delivered strong returns"
        )
    
    if worst and worst.get("final_score", 0) < 0:
        insights["key_factors"].append({
            "type": "negative",
            "title": f"Underperformer: {worst.get('name', 'Unknown')}",
            "detail": f"Cost you {abs(worst.get('final_score', 0))} points"
        })
        insights["areas_to_improve"].append(
            f"Consider diversifying away from volatile stocks like {worst.get('name')}"
        )
    
    # Captain/VC analysis
    captain_score = portfolio_results.get("captain_contribution", 0)
    vc_score = portfolio_results.get("vice_captain_contribution", 0)
    
    if captain_score > 0:
        insights["what_went_well"].append(
            f"Great captain choice! Your 2x multiplier added {captain_score/2:.1f} bonus points"
        )
    elif captain_score < 0:
        insights["areas_to_improve"].append(
            "Your captain pick underperformed. Choose more stable stocks for captain role"
        )
    
    # Sector analysis
    sectors = {}
    for stock in stocks:
        sector = stock.get("breakdown", {}).get("sector_bonus", 0)
        if sector > 0:
            sectors[stock.get("name", "Unknown")] = sector
    
    if sectors:
        insights["key_factors"].append({
            "type": "info",
            "title": "Sector Strength",
            "detail": f"{len(sectors)} of your stocks benefited from sector momentum"
        })
    
    # Generate learning tip based on performance
    if total_score < 0:
        insights["learning_tip"] = (
            "💡 Tip: Consider tracking sector trends before the market opens. "
            "Global markets (US, Asia) often influence Indian market direction!"
        )
    elif total_score < 50:
        insights["learning_tip"] = (
            "💡 Tip: Diversify across sectors! Having all stocks in one sector "
            "increases risk. Try mixing IT, Banking, and FMCG."
        )
    else:
        insights["learning_tip"] = (
            "💡 Tip: You're doing well! To level up, study why your best picks "
            "performed well. Look for similar opportunities in other stocks."
        )
    
    return insights


def get_market_insights() -> Dict:
    """
    Get current market insights for learning
    """
    insights = {
        "market_mood": "neutral",
        "trending_sectors": [],
        "key_news": [],
        "learning_modules": []
    }
    
    # Get trending stocks
    trending_result = get_trending_stocks()
    if trending_result.get("success"):
        trending = trending_result.get("data", {})
        if isinstance(trending, dict) and trending.get("trendingStocks"):
            stocks = trending["trendingStocks"][:5]
            
            # Analyze sector trends
            sectors = {}
            for stock in stocks:
                sector = stock.get("sector") or stock.get("industry") or "Unknown"
                if sector not in sectors:
                    sectors[sector] = 0
                sectors[sector] += 1
            
            insights["trending_sectors"] = [
                {"name": k, "count": v} for k, v in 
                sorted(sectors.items(), key=lambda x: x[1], reverse=True)
            ]
    
    # Get news
    news_result = get_market_news()
    if news_result.get("success"):
        news = news_result.get("data", [])
        if isinstance(news, list):
            insights["key_news"] = [
                {
                    "title": n.get("title", ""),
                    "summary": n.get("description", "")[:150] + "...",
                    "impact": "neutral"
                }
                for n in news[:3]
            ]
    
    # Learning modules (static for now)
    insights["learning_modules"] = [
        {
            "id": 1,
            "title": "Understanding P/E Ratio",
            "description": "Learn what Price-to-Earnings ratio tells you about a stock",
            "difficulty": "Beginner",
            "duration": "5 min"
        },
        {
            "id": 2,
            "title": "Reading Stock Charts",
            "description": "Basics of candlestick charts and trend lines",
            "difficulty": "Beginner",
            "duration": "10 min"
        },
        {
            "id": 3,
            "title": "Sector Rotation Strategy",
            "description": "How money flows between sectors during market cycles",
            "difficulty": "Intermediate",
            "duration": "15 min"
        },
        {
            "id": 4,
            "title": "Risk Management 101",
            "description": "Never put all eggs in one basket - diversification basics",
            "difficulty": "Beginner",
            "duration": "8 min"
        }
    ]
    
    return insights


def generate_tips_for_next_contest(user_history: List[Dict]) -> List[Dict]:
    """
    Generate personalized tips based on user's contest history
    """
    tips = []
    
    if not user_history:
        tips = [
            {
                "icon": "🎯",
                "tip": "Start with a balanced portfolio - mix of large caps and mid caps"
            },
            {
                "icon": "⭐",
                "tip": "Choose your captain wisely - pick a stock you have confidence in"
            },
            {
                "icon": "📰",
                "tip": "Check market news before selecting stocks - it can impact prices"
            }
        ]
    else:
        # Analyze history
        total_score = sum(h.get("score", 0) for h in user_history)
        avg_score = total_score / len(user_history) if user_history else 0
        
        if avg_score < 0:
            tips.append({
                "icon": "🔄",
                "tip": "Try diversifying more - don't put too much in one sector"
            })
        
        if avg_score < 50:
            tips.append({
                "icon": "📈",
                "tip": "Look for stocks with positive momentum - check the trending section"
            })
        
        tips.append({
            "icon": "🎓",
            "tip": f"Your average score is {avg_score:.1f}. Keep learning to improve!"
        })
    
    return tips


def get_stock_learning_context(stock_name: str) -> Dict:
    """
    Get educational context for a specific stock
    """
    from services.stocks import get_stock_details, get_corporate_actions
    
    context = {
        "stock_name": stock_name,
        "fun_facts": [],
        "key_metrics_explained": [],
        "risk_factors": []
    }
    
    stock_result = get_stock_details(stock_name)
    
    if stock_result.get("success") and stock_result.get("data"):
        data = stock_result["data"]
        
        # Market cap explanation
        market_cap = data.get("marketCap") or data.get("market_cap")
        if market_cap:
            if "Cr" in str(market_cap) or float(str(market_cap).replace(",", "").replace("Cr", "")) > 50000:
                context["key_metrics_explained"].append({
                    "metric": "Large Cap Stock",
                    "explanation": "This is a large cap stock (₹50,000+ Cr market cap). These are typically more stable but may have slower growth."
                })
            else:
                context["key_metrics_explained"].append({
                    "metric": "Mid/Small Cap Stock",
                    "explanation": "This is a mid or small cap stock. Higher growth potential but also higher volatility."
                })
        
        # P/E ratio explanation
        pe = data.get("pe") or data.get("PE") or data.get("peRatio")
        if pe:
            try:
                pe_val = float(str(pe).replace(",", ""))
                if pe_val > 40:
                    context["key_metrics_explained"].append({
                        "metric": f"P/E Ratio: {pe}",
                        "explanation": "High P/E suggests investors expect high future growth. Could be overvalued or a growth stock."
                    })
                elif pe_val < 15:
                    context["key_metrics_explained"].append({
                        "metric": f"P/E Ratio: {pe}",
                        "explanation": "Low P/E could mean undervalued stock or market concerns. Good for value investors."
                    })
            except:
                pass
        
        # Risk factors
        sector = data.get("sector") or data.get("industry") or ""
        if "bank" in sector.lower():
            context["risk_factors"].append("Banking stocks are sensitive to RBI interest rate decisions")
        elif "it" in sector.lower() or "tech" in sector.lower():
            context["risk_factors"].append("IT stocks can be affected by US market movements and rupee value")
        elif "pharma" in sector.lower():
            context["risk_factors"].append("Pharma stocks may be affected by regulatory approvals and patent expiries")
    
    return context
