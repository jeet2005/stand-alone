"""
Indian Stock Market Dashboard - Python Flask Backend
A clean, framework-free backend that interfaces with the Indian Stock API
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import requests
import os
from functools import wraps
import time

app = Flask(__name__, static_folder='static')
CORS(app)

# Configuration
API_BASE_URL = "https://stock.indianapi.in"
API_KEY = os.environ.get("INDIAN_STOCK_API_KEY", "sk-live-X3qZHnpBBzuROroa79agxcI90jRjafq4FJ74P9n2")

# Simple in-memory cache
cache = {}
CACHE_DURATION = 300  # 5 minutes

def get_cached(key, fetch_func):
    """Simple caching mechanism"""
    now = time.time()
    if key in cache:
        data, timestamp = cache[key]
        if now - timestamp < CACHE_DURATION:
            return data
    
    data = fetch_func()
    cache[key] = (data, now)
    return data

def make_api_request(endpoint, params=None):
    """Make authenticated request to Indian Stock API"""
    headers = {"X-Api-Key": API_KEY}
    url = f"{API_BASE_URL}{endpoint}"
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

# =====================
# Static File Routes
# =====================

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS)"""
    return send_from_directory('static', filename)

# =====================
# API Proxy Routes
# =====================

@app.route('/api/trending')
def get_trending():
    """Get trending stocks"""
    def fetch():
        return make_api_request("/trending")
    return jsonify(get_cached("trending", fetch))

@app.route('/api/stock')
def get_stock():
    """Get stock details by name"""
    name = request.args.get('name')
    if not name:
        return jsonify({"error": "Stock name is required"}), 400
    
    data = make_api_request("/stock", {"name": name})
    return jsonify(data)

@app.route('/api/news')
def get_news():
    """Get market news"""
    def fetch():
        return make_api_request("/news")
    return jsonify(get_cached("news", fetch))

@app.route('/api/ipo')
def get_ipo():
    """Get IPO data"""
    def fetch():
        return make_api_request("/ipo")
    return jsonify(get_cached("ipo", fetch))

@app.route('/api/commodities')
def get_commodities():
    """Get commodities data"""
    def fetch():
        return make_api_request("/commodities")
    return jsonify(get_cached("commodities", fetch))

@app.route('/api/mutual_funds')
def get_mutual_funds():
    """Get mutual funds data"""
    def fetch():
        return make_api_request("/mutual_funds")
    return jsonify(get_cached("mutual_funds", fetch))

@app.route('/api/price_shockers')
def get_price_shockers():
    """Get price shockers"""
    def fetch():
        return make_api_request("/price_shockers")
    return jsonify(get_cached("price_shockers", fetch))

@app.route('/api/nse_most_active')
def get_nse_most_active():
    """Get NSE most active stocks"""
    def fetch():
        return make_api_request("/NSE_most_active")
    return jsonify(get_cached("nse_most_active", fetch))

@app.route('/api/bse_most_active')
def get_bse_most_active():
    """Get BSE most active stocks"""
    def fetch():
        return make_api_request("/BSE_most_active")
    return jsonify(get_cached("bse_most_active", fetch))

@app.route('/api/52_week_high_low')
def get_52_week_high_low():
    """Get 52 week high/low data"""
    def fetch():
        return make_api_request("/fetch_52_week_high_low_data")
    return jsonify(get_cached("52_week", fetch))

@app.route('/api/historical_data')
def get_historical_data():
    """Get historical data for a stock"""
    stock_name = request.args.get('stock_name')
    period = request.args.get('period', '1m')
    filter_type = request.args.get('filter', 'default')
    
    if not stock_name:
        return jsonify({"error": "Stock name is required"}), 400
    
    data = make_api_request("/historical_data", {
        "stock_name": stock_name,
        "period": period,
        "filter": filter_type
    })
    return jsonify(data)

@app.route('/api/industry_search')
def industry_search():
    """Search stocks by industry"""
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Query is required"}), 400
    
    data = make_api_request("/industry_search", {"query": query})
    return jsonify(data)

@app.route('/api/corporate_actions')
def get_corporate_actions():
    """Get corporate actions for a stock"""
    stock_name = request.args.get('stock_name')
    if not stock_name:
        return jsonify({"error": "Stock name is required"}), 400
    
    data = make_api_request("/corporate_actions", {"stock_name": stock_name})
    return jsonify(data)

@app.route('/api/recent_announcements')
def get_recent_announcements():
    """Get recent announcements for a stock"""
    stock_name = request.args.get('stock_name')
    if not stock_name:
        return jsonify({"error": "Stock name is required"}), 400
    
    data = make_api_request("/recent_announcements", {"stock_name": stock_name})
    return jsonify(data)

# =====================
# Portfolio Management (In-Memory for Demo)
# =====================

portfolios = {}
user_balance = 1000000  # Starting balance: 10 Lakhs

@app.route('/api/portfolio', methods=['GET'])
def get_portfolio():
    """Get user portfolio"""
    return jsonify({
        "balance": user_balance,
        "holdings": portfolios,
        "total_invested": sum(h.get('invested', 0) for h in portfolios.values())
    })

@app.route('/api/portfolio/buy', methods=['POST'])
def buy_stock():
    """Buy a stock"""
    global user_balance
    data = request.json
    
    symbol = data.get('symbol')
    quantity = data.get('quantity', 1)
    price = data.get('price', 0)
    name = data.get('name', symbol)
    
    if not symbol or price <= 0:
        return jsonify({"error": "Invalid stock data"}), 400
    
    total_cost = price * quantity
    if total_cost > user_balance:
        return jsonify({"error": "Insufficient balance"}), 400
    
    user_balance -= total_cost
    
    if symbol in portfolios:
        existing = portfolios[symbol]
        new_qty = existing['quantity'] + quantity
        avg_price = ((existing['avg_price'] * existing['quantity']) + (price * quantity)) / new_qty
        portfolios[symbol] = {
            'name': name,
            'quantity': new_qty,
            'avg_price': avg_price,
            'invested': avg_price * new_qty
        }
    else:
        portfolios[symbol] = {
            'name': name,
            'quantity': quantity,
            'avg_price': price,
            'invested': price * quantity
        }
    
    return jsonify({
        "success": True,
        "message": f"Bought {quantity} shares of {name}",
        "balance": user_balance
    })

@app.route('/api/portfolio/sell', methods=['POST'])
def sell_stock():
    """Sell a stock"""
    global user_balance
    data = request.json
    
    symbol = data.get('symbol')
    quantity = data.get('quantity', 1)
    price = data.get('price', 0)
    
    if symbol not in portfolios:
        return jsonify({"error": "Stock not in portfolio"}), 400
    
    holding = portfolios[symbol]
    if quantity > holding['quantity']:
        return jsonify({"error": "Insufficient shares"}), 400
    
    total_value = price * quantity
    user_balance += total_value
    
    if quantity == holding['quantity']:
        del portfolios[symbol]
    else:
        new_qty = holding['quantity'] - quantity
        portfolios[symbol]['quantity'] = new_qty
        portfolios[symbol]['invested'] = holding['avg_price'] * new_qty
    
    return jsonify({
        "success": True,
        "message": f"Sold {quantity} shares",
        "balance": user_balance
    })

@app.route('/api/portfolio/reset', methods=['POST'])
def reset_portfolio():
    """Reset portfolio to initial state"""
    global user_balance, portfolios
    user_balance = 1000000
    portfolios = {}
    return jsonify({"success": True, "balance": user_balance})

# =====================
# Watchlist Management
# =====================

watchlist = []

@app.route('/api/watchlist', methods=['GET'])
def get_watchlist():
    """Get user watchlist"""
    return jsonify(watchlist)

@app.route('/api/watchlist', methods=['POST'])
def add_to_watchlist():
    """Add stock to watchlist"""
    data = request.json
    symbol = data.get('symbol')
    name = data.get('name')
    
    if not symbol:
        return jsonify({"error": "Symbol is required"}), 400
    
    if any(w['symbol'] == symbol for w in watchlist):
        return jsonify({"error": "Already in watchlist"}), 400
    
    watchlist.append({"symbol": symbol, "name": name})
    return jsonify({"success": True, "watchlist": watchlist})

@app.route('/api/watchlist/<symbol>', methods=['DELETE'])
def remove_from_watchlist(symbol):
    """Remove stock from watchlist"""
    global watchlist
    watchlist = [w for w in watchlist if w['symbol'] != symbol]
    return jsonify({"success": True, "watchlist": watchlist})


if __name__ == '__main__':
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║     Indian Stock Market Dashboard - Flask Backend        ║
    ╠══════════════════════════════════════════════════════════╣
    ║  1. Set your API key:                                    ║
    ║     export INDIAN_STOCK_API_KEY="your-api-key"           ║
    ║                                                          ║
    ║  2. Install dependencies:                                ║
    ║     pip install flask flask-cors requests                ║
    ║                                                          ║
    ║  3. Run the server:                                      ║
    ║     python app.py                                        ║
    ║                                                          ║
    ║  4. Open http://localhost:5000 in your browser           ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    app.run(debug=True, port=5000)
