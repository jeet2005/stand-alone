"""
Stock Service - Complete API Integration
All endpoints from Indian Stock API
"""

from utils.api_client import make_request, cached


# =====================
# Trending & Discovery
# =====================

@cached("trending")
def get_trending_stocks():
    """Get trending stocks with top gainers and losers"""
    return make_request("/trending")


@cached("price_shockers")
def get_price_shockers():
    """Get stocks with significant price movements"""
    return make_request("/price_shockers")


@cached("nse_most_active")
def get_nse_most_active():
    """Get most active stocks on NSE"""
    return make_request("/NSE_most_active")


@cached("bse_most_active")
def get_bse_most_active():
    """Get most active stocks on BSE"""
    return make_request("/BSE_most_active")


@cached("52_week_data")
def get_52_week_high_low():
    """Get 52 week high/low data"""
    return make_request("/fetch_52_week_high_low_data")


# =====================
# Stock Details
# =====================

def get_stock_details(name):
    """Get detailed information for a specific stock"""
    if not name:
        return {"success": False, "error": "Stock name is required"}
    return make_request("/stock", {"name": name})


def get_historical_data(stock_name, period="1m", filter_type="default"):
    """
    Get historical data for charts
    Periods: 1m, 6m, 1yr, 3yr, 5yr, 10yr, max
    Filters: default, price, pe, sm, evebitda, ptb, mcs
    """
    if not stock_name:
        return {"success": False, "error": "Stock name is required"}
    return make_request("/historical_data", {
        "stock_name": stock_name,
        "period": period,
        "filter": filter_type
    })


def get_historical_stats(stock_name, stats):
    """Get historical statistics for a stock"""
    if not stock_name or not stats:
        return {"success": False, "error": "Stock name and stats are required"}
    return make_request("/historical_stats", {
        "stock_name": stock_name,
        "stats": stats
    })


def get_stock_statement(stock_name, stats):
    """Get financial statement data for a stock"""
    if not stock_name or not stats:
        return {"success": False, "error": "Stock name and stats are required"}
    return make_request("/statement", {
        "stock_name": stock_name,
        "stats": stats
    })


def get_corporate_actions(stock_name):
    """Get corporate actions for a stock (dividends, splits, etc.)"""
    if not stock_name:
        return {"success": False, "error": "Stock name is required"}
    return make_request("/corporate_actions", {"stock_name": stock_name})


def get_recent_announcements(stock_name):
    """Get recent announcements for a stock"""
    if not stock_name:
        return {"success": False, "error": "Stock name is required"}
    return make_request("/recent_announcements", {"stock_name": stock_name})


# =====================
# Forecasts & Analysis
# =====================

def get_stock_forecasts(stock_id, measure_code="EPS", period_type="Annual",
                        data_type="Actuals", age="Current"):
    """
    Get stock forecasts
    Measure codes: EPS, CPS, CPX, DPS, EBI, EBT, GPS, GRM, NAV, NDT, NET, PRE, ROA, ROE, SAL
    Period types: Annual, Interim
    Data types: Actuals, Estimates
    Ages: OneWeekAgo, ThirtyDaysAgo, SixtyDaysAgo, NinetyDaysAgo, Current
    """
    if not stock_id:
        return {"success": False, "error": "Stock ID is required"}
    return make_request("/stock_forecasts", {
        "stock_id": stock_id,
        "measure_code": measure_code,
        "period_type": period_type,
        "data_type": data_type,
        "age": age
    })


def get_stock_target_price(stock_id):
    """Get analyst target price for a stock"""
    if not stock_id:
        return {"success": False, "error": "Stock ID is required"}
    return make_request("/stock_target_price", {"stock_id": stock_id})


# =====================
# IPO
# =====================

@cached("ipo")
def get_ipo_data():
    """Get IPO data - upcoming, current, and recently listed"""
    return make_request("/ipo")


# =====================
# News
# =====================

@cached("news", duration=120)  # Cache for 2 minutes only
def get_market_news():
    """Get latest market news"""
    return make_request("/news")


# =====================
# Commodities
# =====================

@cached("commodities")
def get_commodities():
    """Get commodities data (gold, silver, crude, etc.)"""
    return make_request("/commodities")


# =====================
# Mutual Funds
# =====================

@cached("mutual_funds")
def get_mutual_funds():
    """Get mutual funds list"""
    return make_request("/mutual_funds")


def search_mutual_fund(query):
    """Search for mutual funds by name"""
    if not query:
        return {"success": False, "error": "Query is required"}
    return make_request("/mutual_fund_search", {"query": query})


def get_mutual_fund_details(stock_name):
    """Get detailed info about a specific mutual fund"""
    if not stock_name:
        return {"success": False, "error": "Fund name is required"}
    return make_request("/mutual_funds_details", {"stock_name": stock_name})


# =====================
# Industry Search
# =====================

def search_by_industry(query):
    """Search stocks by industry/sector"""
    if not query:
        return {"success": False, "error": "Query is required"}
    return make_request("/industry_search", {"query": query})
