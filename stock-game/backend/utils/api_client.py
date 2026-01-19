"""
API Client for Indian Stock Market API
Uses http.client as per user requirement
"""

import http.client
import json
import os
import time
from functools import wraps
from urllib.parse import urlencode

# API Configuration
API_HOST = "stock.indianapi.in"
API_KEY = None

# Simple in-memory cache
_cache = {}
CACHE_DURATION = 300  # 5 minutes


def get_api_key():
    """Get API key from environment"""
    global API_KEY
    if API_KEY is None:
        from dotenv import load_dotenv
        load_dotenv()
        API_KEY = os.environ.get("INDIAN_STOCK_API_KEY", "")
    return API_KEY


def cached(key_prefix, duration=CACHE_DURATION):
    """Decorator for caching API responses"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}:{str(args)}:{str(kwargs)}"
            now = time.time()
            
            if cache_key in _cache:
                data, timestamp = _cache[cache_key]
                if now - timestamp < duration:
                    return data
            
            result = func(*args, **kwargs)
            _cache[cache_key] = (result, now)
            return result
        return wrapper
    return decorator


def make_request(endpoint, params=None, timeout=15):
    """
    Make authenticated request to Indian Stock API using http.client
    """
    api_key = get_api_key()
    headers = {"X-Api-Key": api_key}
    
    # Build URL with query params
    url = endpoint
    if params:
        query_string = urlencode({k: v for k, v in params.items() if v})
        if query_string:
            url = f"{endpoint}?{query_string}"
    
    try:
        conn = http.client.HTTPSConnection(API_HOST, timeout=timeout)
        conn.request("GET", url, headers=headers)
        
        response = conn.getresponse()
        data = response.read().decode("utf-8")
        conn.close()
        
        if response.status == 200:
            return {"success": True, "data": json.loads(data)}
        else:
            return {"success": False, "error": f"HTTP {response.status}: {data[:200]}"}
            
    except http.client.HTTPException as e:
        return {"success": False, "error": f"HTTP Error: {str(e)}"}
    except json.JSONDecodeError as e:
        return {"success": False, "error": f"JSON Parse Error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}


def clear_cache():
    """Clear all cached data"""
    global _cache
    _cache = {}
    return {"success": True, "message": "Cache cleared"}
