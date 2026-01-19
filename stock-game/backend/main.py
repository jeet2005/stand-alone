"""
Stock Market Fantasy Game - Main Flask Application
Dream11-style stock market learning game with ALL Indian Stock API integrations
"""

import os
import sys

# Add backend to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import services
from services import stocks, contests, scoring, learning
from utils.api_client import clear_cache

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# User session (in-memory for demo)
user_data = {
    "id": "user_001",
    "name": "Player",
    "balance": 1000000,
    "total_points": 0,
    "contests_played": 0,
    "wins": 0
}

# ======================
# Static File Routes
# ======================

@app.route('/')
def index():
    """Serve landing page"""
    return send_from_directory('../frontend', 'index.html')


@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('../frontend', filename)


# ======================
# Stock API Routes (ALL ENDPOINTS)
# ======================

@app.route('/api/trending')
def get_trending():
    """Get trending stocks"""
    result = stocks.get_trending_stocks()
    return jsonify(result)


@app.route('/api/stock')
def get_stock():
    """Get stock details by name"""
    name = request.args.get('name')
    result = stocks.get_stock_details(name)
    return jsonify(result)


@app.route('/api/historical_data')
def get_historical_data():
    """Get historical data for charts"""
    stock_name = request.args.get('stock_name')
    period = request.args.get('period', '1m')
    filter_type = request.args.get('filter', 'default')
    result = stocks.get_historical_data(stock_name, period, filter_type)
    return jsonify(result)


@app.route('/api/historical_stats')
def get_historical_stats():
    """Get historical statistics"""
    stock_name = request.args.get('stock_name')
    stats = request.args.get('stats')
    result = stocks.get_historical_stats(stock_name, stats)
    return jsonify(result)


@app.route('/api/statement')
def get_statement():
    """Get financial statement"""
    stock_name = request.args.get('stock_name')
    stats = request.args.get('stats')
    result = stocks.get_stock_statement(stock_name, stats)
    return jsonify(result)


@app.route('/api/news')
def get_news():
    """Get market news"""
    result = stocks.get_market_news()
    return jsonify(result)


@app.route('/api/ipo')
def get_ipo():
    """Get IPO data"""
    result = stocks.get_ipo_data()
    return jsonify(result)


@app.route('/api/commodities')
def get_commodities():
    """Get commodities data"""
    result = stocks.get_commodities()
    return jsonify(result)


@app.route('/api/mutual_funds')
def get_mutual_funds():
    """Get mutual funds data"""
    result = stocks.get_mutual_funds()
    return jsonify(result)


@app.route('/api/mutual_fund_search')
def search_mutual_funds():
    """Search mutual funds"""
    query = request.args.get('query')
    result = stocks.search_mutual_fund(query)
    return jsonify(result)


@app.route('/api/mutual_fund_details')
def get_mutual_fund_details():
    """Get mutual fund details"""
    stock_name = request.args.get('stock_name')
    result = stocks.get_mutual_fund_details(stock_name)
    return jsonify(result)


@app.route('/api/price_shockers')
def get_price_shockers():
    """Get price shockers"""
    result = stocks.get_price_shockers()
    return jsonify(result)


@app.route('/api/nse_most_active')
def get_nse_most_active():
    """Get NSE most active stocks"""
    result = stocks.get_nse_most_active()
    return jsonify(result)


@app.route('/api/bse_most_active')
def get_bse_most_active():
    """Get BSE most active stocks"""
    result = stocks.get_bse_most_active()
    return jsonify(result)


@app.route('/api/52_week_high_low')
def get_52_week_high_low():
    """Get 52 week high/low data"""
    result = stocks.get_52_week_high_low()
    return jsonify(result)


@app.route('/api/corporate_actions')
def get_corporate_actions():
    """Get corporate actions for a stock"""
    stock_name = request.args.get('stock_name')
    result = stocks.get_corporate_actions(stock_name)
    return jsonify(result)


@app.route('/api/recent_announcements')
def get_recent_announcements():
    """Get recent announcements"""
    stock_name = request.args.get('stock_name')
    result = stocks.get_recent_announcements(stock_name)
    return jsonify(result)


@app.route('/api/industry_search')
def search_industry():
    """Search stocks by industry"""
    query = request.args.get('query')
    result = stocks.search_by_industry(query)
    return jsonify(result)


@app.route('/api/stock_forecasts')
def get_stock_forecasts():
    """Get stock forecasts"""
    stock_id = request.args.get('stock_id')
    measure_code = request.args.get('measure_code', 'EPS')
    period_type = request.args.get('period_type', 'Annual')
    data_type = request.args.get('data_type', 'Actuals')
    age = request.args.get('age', 'OneWeekAgo')
    result = stocks.get_stock_forecasts(stock_id, measure_code, period_type, data_type, age)
    return jsonify(result)


@app.route('/api/stock_target_price')
def get_stock_target_price():
    """Get analyst target price"""
    stock_id = request.args.get('stock_id')
    result = stocks.get_stock_target_price(stock_id)
    return jsonify(result)


# ======================
# Contest API Routes
# ======================

@app.route('/api/contests')
def get_contests():
    """Get all active contests"""
    result = contests.get_active_contests()
    return jsonify(result)


@app.route('/api/contests/<contest_id>')
def get_contest(contest_id):
    """Get specific contest details"""
    result = contests.get_contest_by_id(contest_id)
    return jsonify(result)


@app.route('/api/contests/create/daily', methods=['POST'])
def create_daily_contest():
    """Create a new daily contest"""
    result = contests.create_daily_contest()
    return jsonify(result)


@app.route('/api/contests/create/weekly', methods=['POST'])
def create_weekly_contest():
    """Create a new weekly contest"""
    result = contests.create_weekly_contest()
    return jsonify(result)


@app.route('/api/contests/<contest_id>/submit', methods=['POST'])
def submit_portfolio(contest_id):
    """Submit portfolio for a contest"""
    data = request.json
    result = contests.submit_portfolio(
        contest_id=contest_id,
        user_id=user_data["id"],
        stocks=data.get("stocks", []),
        captain_symbol=data.get("captain"),
        vice_captain_symbol=data.get("vice_captain")
    )
    
    if result.get("success"):
        user_data["contests_played"] += 1
    
    return jsonify(result)


@app.route('/api/contests/<contest_id>/leaderboard')
def get_leaderboard(contest_id):
    """Get contest leaderboard"""
    result = contests.get_contest_leaderboard(contest_id)
    return jsonify(result)


@app.route('/api/user/entries')
def get_user_entries():
    """Get user's contest entries"""
    result = contests.get_user_entries(user_data["id"])
    return jsonify(result)


# ======================
# Scoring API Routes
# ======================

@app.route('/api/scoring/rules')
def get_scoring_rules():
    """Get scoring rules"""
    result = scoring.get_scoring_rules()
    return jsonify(result)


@app.route('/api/scoring/calculate', methods=['POST'])
def calculate_score():
    """Calculate score for a portfolio"""
    data = request.json
    result = scoring.calculate_portfolio_score(
        stocks=data.get("stocks", []),
        captain_symbol=data.get("captain", ""),
        vice_captain_symbol=data.get("vice_captain", "")
    )
    return jsonify(result)


@app.route('/api/scoring/rank')
def get_rank():
    """Get rank/tier for a score"""
    score = float(request.args.get('score', 0))
    result = scoring.rank_portfolio(score)
    return jsonify(result)


# ======================
# Learning API Routes
# ======================

@app.route('/api/learning/analyze', methods=['POST'])
def analyze_performance():
    """Analyze portfolio performance"""
    data = request.json
    result = learning.analyze_performance(data)
    return jsonify(result)


@app.route('/api/learning/insights')
def get_market_insights():
    """Get market insights for learning"""
    result = learning.get_market_insights()
    return jsonify(result)


@app.route('/api/learning/tips')
def get_tips():
    """Get personalized tips"""
    entries = contests.get_user_entries(user_data["id"])
    history = entries.get("entries", [])
    result = learning.generate_tips_for_next_contest(history)
    return jsonify(result)


@app.route('/api/learning/stock/<stock_name>')
def get_stock_learning(stock_name):
    """Get educational context for a stock"""
    result = learning.get_stock_learning_context(stock_name)
    return jsonify(result)


# ======================
# User API Routes
# ======================

@app.route('/api/user')
def get_user():
    """Get current user data"""
    return jsonify(user_data)


@app.route('/api/user/reset', methods=['POST'])
def reset_user():
    """Reset user data"""
    global user_data
    user_data = {
        "id": "user_001",
        "name": "Player",
        "balance": 1000000,
        "total_points": 0,
        "contests_played": 0,
        "wins": 0
    }
    return jsonify({"success": True, "user": user_data})


# ======================
# Utility Routes
# ======================

@app.route('/api/cache/clear', methods=['POST'])
def clear_api_cache():
    """Clear API cache"""
    result = clear_cache()
    return jsonify(result)


@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "Stock Market Fantasy Game API is running!",
        "version": "1.0.0"
    })


# ======================
# Main Entry Point
# ======================

if __name__ == '__main__':
    print("""
    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║       🎮 STOCK MARKET FANTASY GAME 🎮                             ║
    ║       Dream11-Style Stock Market Learning Game                    ║
    ║                                                                   ║
    ╠═══════════════════════════════════════════════════════════════════╣
    ║                                                                   ║
    ║   📊 Features:                                                    ║
    ║   • All Indian Stock API endpoints integrated                     ║
    ║   • Daily & Weekly Fantasy Contests                               ║
    ║   • Dream11-style Scoring with Captain/VC                         ║
    ║   • AI-powered Learning Insights                                  ║
    ║                                                                   ║
    ║   🚀 Starting server at http://localhost:5000                     ║
    ║                                                                   ║
    ║   ⚠️  DISCLAIMER: This is for EDUCATIONAL purposes only.          ║
    ║       No real money. No real trading. Learn & have fun!           ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
    """)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
